import { Request, Response, NextFunction } from 'express';
import { languageUtil } from '../utils/get-language.util';
import elasticsearch from '../configs/elasticsearch';
import logger from '../configs/logger';
import { CurrencyEnum } from '../enums/currency-enum';
import moment from 'moment';
import { getJSON, setJSON } from '../utils/cache.util';

import {
  trendingSchema,
  trendingSchemV2,
  trendingAirportsSchema,
  trendingAirportsSchemaV2,
  trendingCitiesSchema,
  trendingNearBySchema,
  dynamicPageSectionsSchema,
  cheapestFlightsEveryWhereSchema,
  faqsSchema
} from '../validators/trending.schema';
import { Image, Country, Airline, Airport, City } from '../models';
import TranslationService from '../middlewares/translation';
import {
  trendingService,
  trendingAirportsService
} from '../services/trending.service';
import {
  AirlineInfo,
  AirlinesObject
} from '../interfaces/airlineInfo.interface';
import { nearByService } from '../services/airport.service';
import currencyConverter from '../middlewares/currencyConverter';
import AppError from '../utils/appError.util';

// Initialize the cache set to 1 week (10080 minutes)
const cacheTime = 10080;

// FAQsMethods function to get details of the FAQs when the user search for (origin or destination or (origin & destination))
async function FAQsMethods(flightsSearchData, currency) {
  const convertCurrency = await currencyConverter(currency);
  if (flightsSearchData.length > 0) {
    const allFlightsSearchIDs = [],
      flightsSection = [];
    for (const flightSearchData of flightsSearchData) {
      allFlightsSearchIDs.push(flightSearchData._id);
    }

    const flightsSearchIDs = Array.from(new Set(allFlightsSearchIDs));

    const flightsAirlinesArr = [],
      allFlightsDuration = [];
    for (const flightSearchID of flightsSearchIDs) {
      const flightsRedirectsInitIterations = await elasticsearch.search({
        index: `flight_redirects`,
        body: {
          query: {
            bool: {
              must: [
                { match: { searchId: flightSearchID } },
                {
                  range: {
                    'legs.departure': {
                      gte: 'now+1d/d',
                      lte: 'now+2M/d'
                    }
                  }
                },
                { exists: { field: 'price' } },
                {
                  exists: {
                    field: 'segments'
                  }
                }
              ]
            }
          }
        }
      });

      const redirectHitsData = flightsRedirectsInitIterations.hits.hits;

      for (const redirectFlightData of redirectHitsData) {
        const departureDateTime =
            redirectFlightData._source['legs'][0]['departure'].split('T'),
          departureDate = departureDateTime[0],
          departureTimeSection = departureDateTime[1].split('+'),
          departureTime = departureTimeSection[0],
          arrvialDateTime =
            redirectFlightData._source['legs'][0]['arival'].split('T'),
          arrivalDate = arrvialDateTime[0],
          arrvialTimeSection = arrvialDateTime[1].split('+'),
          arivalTime = arrvialTimeSection[0],
          flightPrice = redirectFlightData._source['price'],
          flightCurrency = redirectFlightData._source['currency'],
          flightSegments = redirectFlightData._source['segments'];

        if (CurrencyEnum[flightCurrency]) {
          // Get the current date
          const currentDate = new Date();

          // to filter redirect flights based departureDate
          const tomorrow = new Date(currentDate);
          tomorrow.setDate(tomorrow.getDate() + 1);

          const actualDepartureDate = new Date(departureDate);

          let convertedPrice;
          if (actualDepartureDate >= tomorrow && flightSegments.length > 0) {
            const stopsCount = flightSegments.length - 1;
            if (currency !== flightCurrency) {
              convertedPrice = Number(
                convertCurrency(flightPrice, flightCurrency).toFixed(2)
              );
            } else {
              convertedPrice = flightPrice;
            }

            // looping in the segments to get the redirect flights to get flight total duration
            let duration = 0;
            const durationArr = [];
            for (const seg of flightSegments) {
              if (
                seg.operatingCarrier &&
                (seg.operatingCarrier !== undefined ||
                  seg.operatingCarrier !== '' ||
                  seg.operatingCarrier !== 'null' ||
                  seg.operatingCarrier !== null)
              ) {
                flightsAirlinesArr.push(seg.operatingCarrier);
              }

              if (
                seg.duration &&
                seg.duration !== undefined &&
                seg.duration !== 0
              ) {
                const seg_duration =
                  seg.duration < 0 ? -seg.duration : seg.duration;
                durationArr.push(seg_duration);
              } else {
                durationArr.push('duration_err');
              }
            }

            if (!durationArr.includes('duration_err')) {
              const sum = durationArr.reduce(
                (accumulator, currentValue) => accumulator + currentValue,
                0
              );
              duration += sum;
              allFlightsDuration.push(duration);
            }

            if (duration > 0) {
              const flightObj = {
                originalDeparture:
                  redirectFlightData._source['legs'][0]['departure'],
                departureDate,
                departureTime,
                original_arrival:
                  redirectFlightData._source['legs'][0]['arival'],
                arrivalDate,
                arivalTime,
                price: convertedPrice,
                currency,
                stopsCount,
                duration
              };
              flightsSection.push(flightObj);
            }
          }
        }
      }
    }

    if (flightsSection.length > 0) {
      // sort the flights based on the price
      const flightsPriceSorted = [...flightsSection].sort(
        (a, b) => a.price - b.price
      );

      // the cheapest flight
      const cheapestFlight = flightsPriceSorted[0];

      // sort the flights based on the duration
      const flightsDurationSorted = [...flightsSection].sort(
        (a, b) => a.duration - b.duration
      );

      // the shortest duration
      const shortestDuration = flightsDurationSorted[0].duration;

      // the longest duration
      const longestDuration =
        flightsDurationSorted[flightsDurationSorted.length - 1].duration;

      // Convert array to a Set to remove duplicates, then convert it back to an array
      const flightsAirlines = Array.from(new Set(flightsAirlinesArr));

      const airlinesData = [];
      for (const flightAirline of flightsAirlines) {
        const airlineData = await Airline.findOne(
          { code: flightAirline },
          { name: 1, image: 1 }
        );

        if (airlineData) {
          const airlineDataObj = {
            code: flightAirline,
            name: airlineData.name
          };

          airlinesData.push(airlineDataObj);
        }
      }

      return {
        airlines: airlinesData,
        cheapestFlight,
        durations: {
          shortest: shortestDuration,
          longest: longestDuration
        }
      };
    } else {
      return undefined;
    }
  }
}

// Function to find an object by id
function findFlightSourceById(id, flightsValues) {
  const flightValue = flightsValues.find((flight) => flight._id === id);
  return flightValue['_source'];
}

async function checkOrigDestExisted(sectionType, sectionValue) {
  if (sectionType === 'airport') {
    return await Airport.findOne(
      { code: sectionValue },
      { name: 0, translation: 0, code: 0, city: 0 }
    );
  } else if (sectionType === 'city') {
    return await City.findOne(
      { code: sectionValue },
      { name: 0, translation: 0, code: 0, country: 0, image: 0 }
    );
  } else if (sectionType === 'country') {
    return await Country.findOne(
      { code: sectionValue },
      { name: 0, translation: 0, currency: 0 }
    );
  }
}

export const trending = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.query.currency) {
    return res.status(200).json({
      metadata: [
        {
          total: 0
        }
      ],
      data: []
    });
  }

  const { error, value } = trendingSchema.validate(req.query);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const { currency, page, limit, search } = value;

  if (!currency) {
    return next(new AppError('Currency is required', 422));
  }

  const language = languageUtil(req);

  const result = await trendingService(
    req.ip,
    language,
    currency,
    page,
    limit,
    search
  );

  if (result.status === 'Error') {
    return next(new AppError(result.message, result.code));
  }

  return res.status(200).json(result);
};

export const trendingAirports = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = trendingAirportsSchema.validate(req.query);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const language = languageUtil(req);

  const { code, type } = value;
  const page = 1;
  const limit = 10;

  const results = await trendingAirportsService(
    code,
    type,
    language,
    page,
    limit
  );

  if (results.status === 'Error') {
    return next(new AppError(results.message, results.code));
  }

  return res.status(200).json(results);
};

export const trending2 = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { error, value } = trendingSchemV2.validate(req.query);

    if (error) {
      return next(new AppError(error.details[0].message, 422));
    }

    const { code, currency, limit } = value;
    const language = languageUtil(req);

    const convertCurrency = await currencyConverter(currency as string);
    const uniqueTrips = {};
    const initIterations = await elasticsearch.search({
      index: `trending_routes`,
      size: Number(limit) * 10,
      scroll: '1m',
      body: {
        query: {
          match: {
            originCity: code as string
          }
        }
      },
      sort: [{ rank: { order: 'desc' } }]
    });

    let scrollID = initIterations._scroll_id;
    let routes: any = initIterations.hits.hits;

    if (routes.length === 0) {
      return next(new AppError('No results found', 404));
    }

    let destinations = [];
    const pricesIDs = new Set();

    while (destinations.length < Number(limit) && routes.length > 0) {
      for (const route of routes) {
        if (
          !route._source.destinationCity ||
          route._source.destinationCity === null ||
          route._source.destinationCity === undefined
        )
          continue;

        destinations.push({
          id: route._id,
          ...route._source
        });

        pricesIDs.add(`${route._id}-oneway`);
        pricesIDs.add(`${route._id}-round`);
      }

      if (destinations.length < Number(limit)) {
        const nextIterations = await elasticsearch.scroll({
          scroll_id: scrollID,
          scroll: '1m'
        });

        scrollID = nextIterations._scroll_id;
        routes = nextIterations.hits.hits;
      }
    }

    destinations = destinations.filter((item) => {
      const found = uniqueTrips[item.destinationCity];
      if (!found) {
        uniqueTrips[item.destinationCity] = item;
        return true;
      }
      return false;
    });
    let slicedDestinations: any[] = destinations.slice(0, Number(limit));
    const destinationsCodes = slicedDestinations.map(
      (item: any) => item.destinationCity
    );

    const [
      {
        hits: { hits: prices }
      },
      {
        hits: { hits: places }
      },
      images
    ] = await Promise.all([
      elasticsearch.search({
        index: `maps`,
        body: {
          query: {
            bool: {
              must: [
                {
                  terms: {
                    _id: Array.from(pricesIDs)
                  }
                }
              ],
              must_not: [
                {
                  term: {
                    'filters.prices.min': 0
                  }
                },
                {
                  term: {
                    'filters.prices.max': 0
                  }
                }
              ]
            }
          }
        },
        size: Number(limit) * 100
      }),
      elasticsearch.search({
        index: `places`,
        body: {
          query: {
            bool: {
              should: [
                {
                  terms: {
                    'code.keyword': destinationsCodes
                  }
                }
              ],
              filter: {
                match: {
                  placeType: 'city'
                }
              }
            }
          }
        },
        size: Number(limit) * 100
      }),
      Image.find({
        filename: {
          $in: destinationsCodes
        }
      })
    ]);

    if (scrollID) {
      await elasticsearch.clearScroll({ scroll_id: scrollID });
    }

    const mappedPrices = prices.reduce((acc, price) => {
      const data: any = price._source;

      if (!acc[`${data.origin}-${data.destination}`]) {
        acc[`${data.origin}-${data.destination}`] = {};
      }

      if (
        price._source['filters']['prices']['min'] === null ||
        price._source['filters']['prices']['max'] === null
      ) {
        acc[`${data.origin}-${data.destination}`] = undefined;
        return acc;
      }

      acc[`${data.origin}-${data.destination}`][data.tripType] =
        convertCurrency(
          price._source['filters']['prices']['min'],
          'USD'
        ).toFixed(2);
      acc[`${data.origin}-${data.destination}`][data.tripType] === '0.00'
        ? (acc[`${data.origin}-${data.destination}`][data.tripType] = '')
        : acc[`${data.origin}-${data.destination}`][data.tripType];

      return acc;
    }, {});

    const cities = places.reduce((acc, place) => {
      const data: any = place._source;
      acc[data.code] = {
        name: data.name[language as string],
        phrase: data.phrase[language as string]
      };
      return acc;
    }, {});

    slicedDestinations = slicedDestinations
      .map((item) => {
        const image = images.find(
          (img) => img.filename === item.destinationCity
        );
        if (mappedPrices[item.id]) {
          return {
            ...item,
            prices: mappedPrices[item.id],
            city: cities[item.destinationCity],
            image: image ? image.pathWithFilename : ''
          };
        }
        return null;
      })
      .filter((item) => item !== null);

    return res.json(slicedDestinations);
  } catch (error) {
    logger.error('Error in trending2:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
export const trendingAirports2 = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { error, value } = trendingAirportsSchemaV2.validate(req.query);

    if (error) {
      return next(new AppError(error.details[0].message, 422));
    }

    const { code, currency, limit, type } = value;
    const language = languageUtil(req);

    const convertCurrency = await currencyConverter(currency as string);

    let destinations = [];
    let remaining = Number(limit);
    const pricesIDs = [];

    const initIterations = await elasticsearch.search({
      index: `trending_routes`,
      size: remaining,
      scroll: '1m',
      body:
        type === 'airport'
          ? {
              query: {
                match: {
                  origin: code as string
                }
              }
            }
          : {
              query: {
                match: {
                  originCity: code as string
                }
              }
            },
      sort: [{ rank: { order: 'desc' } }]
    });
    let scrollID = initIterations._scroll_id;
    let routes: any = initIterations.hits.hits;

    if (routes.length === 0) {
      return next(new AppError('No results found', 404));
    }

    while (remaining > 0 && routes.length > 0) {
      for (const route of routes) {
        destinations.push({
          id: route._id,
          ...route._source
        });
        pricesIDs.push(`${route._id}-oneway`, `${route._id}-round`);
      }

      destinations = destinations.filter(
        (value, index, self) =>
          index === self.findIndex((t) => t.destination === value.destination)
      );

      const nextIterations = await elasticsearch.scroll({
        scroll_id: scrollID,
        scroll: '1m'
      });

      scrollID = nextIterations._scroll_id;
      routes = nextIterations.hits.hits;
      remaining -= destinations.length;
    }

    destinations = destinations.slice(0, Number(limit));
    const destinationsCodes = destinations.map(
      (item: any) => item.destinationCity
    );

    const [
      {
        hits: { hits: prices }
      },
      {
        hits: { hits: places }
      },
      images
    ] = await Promise.all([
      elasticsearch.search({
        index: `maps`,
        body: {
          query: {
            ids: {
              values: pricesIDs
            }
          },
          size: Number(limit) * 2
        }
      }),
      elasticsearch.search({
        index: `places`,
        body: {
          query: {
            bool: {
              should: [
                {
                  terms: {
                    'code.keyword': destinations.map((item) => item.destination)
                  }
                }
              ],
              filter: {
                match: {
                  placeType: 'airport'
                }
              }
            }
          }
        },
        size: Number(limit)
      }),
      Image.find({
        filename: {
          $in: destinationsCodes
        }
      })
    ]);
    logger.info(places);

    const mappedPrices = prices.reduce((acc, price) => {
      const data: any = price._source;
      if (!acc[`${data.origin}-${data.destination}`]) {
        acc[`${data.origin}-${data.destination}`] = {};
      }

      if (
        price._source['filters']['prices']['min'] === null ||
        price._source['filters']['prices']['max'] === null
      ) {
        acc[`${data.origin}-${data.destination}`] = undefined;
        return acc;
      }

      acc[`${data.origin}-${data.destination}`][data.tripType] =
        convertCurrency(
          price._source['filters']['prices']['min'],
          'USD'
        ).toFixed(2);
      acc[`${data.origin}-${data.destination}`][data.tripType] === '0.00'
        ? (acc[`${data.origin}-${data.destination}`][data.tripType] = '')
        : acc[`${data.origin}-${data.destination}`][data.tripType];
      return acc;
    }, {});

    if (scrollID) {
      try {
        await elasticsearch.clearScroll({ scroll_id: scrollID });
      } catch (error) {
        logger.warn('Failed to clear scroll context:', error.meta.body);
      }
    }

    const cities = places.reduce((acc, place) => {
      const data: any = place._source;
      acc[data.code] = {
        name: data.name[language as string],
        phrase: data.phrase[language as string]
      };
      return acc;
    }, {});

    destinations = destinations
      .map((item) => {
        const image = images.find(
          (img) => img.filename === item.destinationCity
        );
        if (!mappedPrices[item.id]) return {};
        return {
          ...item,
          prices: mappedPrices[item.id],
          airport: cities[item.destination],
          image: image ? image.pathWithFilename : ''
        };
      })
      .filter((item) => Object.keys(item).length !== 0);

    return res.json(destinations);
  } catch (error) {
    logger.error('Error in trendingAirports2:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const trendingCities = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = trendingCitiesSchema.validate(req.query);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const { code, page, limit } = value;

  const language = languageUtil(req);

  const {
    hits: { hits: routes }
  } = await elasticsearch.search({
    index: 'trending_routes',
    size: Number(limit),
    from: (Number(page) - 1) * Number(limit),
    body: {
      query: {
        bool: {
          should: [
            {
              match: {
                origin: code as string
              }
            },
            {
              match: {
                originCity: code as string
              }
            }
          ]
        }
      },
      sort: [
        {
          rank: {
            order: 'desc'
          }
        }
      ]
    }
  });
  const destinationsCodes = routes
    .map((item: any) => item._source.destinationCity)
    .filter((item) => item);

  const {
    hits: { hits: places }
  } = await elasticsearch.search({
    index: `places`,
    body: {
      query: {
        bool: {
          should: [
            {
              terms: {
                'code.keyword': destinationsCodes
              }
            }
          ],
          filter: {
            match: {
              placeType: 'city'
            }
          }
        }
      }
    },
    size: Number(limit) * 10
  });

  const images = await Image.find({
    filename: {
      $in: destinationsCodes
    }
  });

  const cities = places.reduce((acc, place) => {
    const data: any = place._source;
    const image = images.find((item) => item.filename === data.code);

    acc[data.code] = {
      name: data.name[language as string],
      phrase: data.phrase[language as string],
      code: data.code,
      image: image ? image.pathWithFilename : ''
    };
    return acc;
  }, {});

  const destinations = routes
    .map((route: any) => {
      return cities[route._source.destinationCity];
    })
    .filter((item) => item);

  return res.json(destinations);
};

export const trendingNearBy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { error, value } = trendingNearBySchema.validate(req.query);
    const language = languageUtil(req);

    if (error) {
      return next(new AppError(error.details[0].message, 422));
    }

    const results = await nearByService(req.ip, req.query, language);

    if (results.status === 'Error') {
      return next(new AppError(results.message, results.code));
    }

    const nearByData: any[] = [];
    results.forEach((item) => {
      nearByData.push({
        code: item.code,
        type: item.placeType
      });
    });

    const { currency, limit } = value;
    const convertCurrency = await currencyConverter(currency as string);
    const finalDestinations: any[] = [];
    const uniqueTrips = {};

    for (const nearBy of nearByData) {
      const { code, type } = nearBy;
      let destinations = [];
      let remaining = Number(limit);
      const pricesIDs = [];

      const initIterations = await elasticsearch.search({
        index: `trending_routes`,
        size: remaining,
        scroll: '1m',
        body:
          type === 'airport'
            ? {
                query: {
                  match: {
                    origin: code as string
                  }
                }
              }
            : {
                query: {
                  match: {
                    originCity: code as string
                  }
                }
              },
        sort: [{ rank: { order: 'desc' } }]
      });
      let scrollID = initIterations._scroll_id;
      let routes: any = initIterations.hits.hits;

      if (routes.length === 0) {
        return next(new AppError('No results found', 404));
      }

      while (remaining > 0) {
        for (const route of routes) {
          destinations.push({
            id: route._id,
            ...route._source
          });
          pricesIDs.push(`${route._id}-oneway`, `${route._id}-round`);
        }

        destinations = destinations.filter(
          (value, index, self) =>
            index === self.findIndex((t) => t.destination === value.destination)
        );

        const nextIterations = await elasticsearch.scroll({
          scroll_id: scrollID,
          scroll: '1m'
        });

        scrollID = nextIterations._scroll_id;
        routes = nextIterations.hits.hits;
        remaining -= destinations.length;

        if (routes.length === 0) break; // Exit loop if no more routes
      }

      await elasticsearch.clearScroll({ scroll_id: scrollID }); // Clear scroll context after use

      destinations = destinations.filter((item) => {
        const found = uniqueTrips[item.id];
        if (!found) {
          uniqueTrips[item.id] = item;
          return true;
        }
        return false;
      });
      destinations = destinations.slice(0, Number(limit));

      const destinationsCodes = destinations.map(
        (item: any) => item.destinationCity
      );

      const [
        {
          hits: { hits: prices }
        },
        {
          hits: { hits: places }
        },
        images
      ] = await Promise.all([
        elasticsearch.search({
          index: `maps`,
          body: {
            query: {
              ids: {
                values: pricesIDs
              }
            },
            size: Number(limit) * 2
          }
        }),
        elasticsearch.search({
          index: `places`,
          body: {
            query: {
              bool: {
                should: [
                  {
                    terms: {
                      'code.keyword': destinations.map(
                        (item) => item.destination
                      )
                    }
                  }
                ],
                filter: {
                  match: {
                    placeType: 'airport'
                  }
                }
              }
            },
            size: Number(limit)
          }
        }),
        Image.find({
          filename: {
            $in: destinationsCodes
          }
        })
      ]);

      const mappedPrices = prices.reduce((acc, price) => {
        const data: any = price._source;
        if (!acc[`${data.origin}-${data.destination}`]) {
          acc[`${data.origin}-${data.destination}`] = {};
        }

        if (
          price._source['filters']['prices']['min'] === null ||
          price._source['filters']['prices']['max'] === null
        ) {
          acc[`${data.origin}-${data.destination}`] = undefined;
          return acc;
        }

        acc[`${data.origin}-${data.destination}`][data.tripType] =
          convertCurrency(
            price._source['filters']['prices']['min'],
            'USD'
          ).toFixed(2);
        acc[`${data.origin}-${data.destination}`][data.tripType] === '0.00'
          ? (acc[`${data.origin}-${data.destination}`][data.tripType] = '')
          : acc[`${data.origin}-${data.destination}`][data.tripType];
        return acc;
      }, {});

      const cities = places.reduce((acc, place) => {
        const data: any = place._source;
        acc[data.code] = {
          name: data.name[language as string],
          phrase: data.phrase[language as string]
        };
        return acc;
      }, {});

      destinations = destinations
        .map((item) => {
          const image = images.find(
            (img) => img.filename === item.destinationCity
          );
          if (!mappedPrices[item.id]) return {};
          return {
            ...item,
            prices: mappedPrices[item.id],
            airport: cities[item.destination],
            image: image ? image.pathWithFilename : ''
          };
        })
        .filter((item) => Object.keys(item).length !== 0);
      finalDestinations.push({ code: code, data: { ...destinations } });
    }

    res.status(200).json(finalDestinations);
  } catch (err) {
    return next(err);
  }
};

export const topCountries = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { error, value } = trendingSchemV2.validate(req.query);

    if (error) {
      return next(new AppError(error.details[0].message, 422));
    }

    const { code, currency, limit } = value;

    const convertCurrency = await currencyConverter(currency as string);

    const initIterations = await elasticsearch.search({
      index: `trending_routes`,
      size: Number(limit) * 30,
      scroll: '1m',
      body: {
        query: {
          match: {
            originCity: code as string
          }
        }
      },
      sort: [{ rank: { order: 'desc' } }]
    });
    let scrollID = initIterations._scroll_id;
    let routes: any = initIterations.hits.hits;

    if (routes.length === 0) {
      return next(new AppError('No results found', 404));
    }
    const destinations = new Set();
    const pricesIDs = new Set();

    while (destinations.size < Number(limit) && routes.length > 0) {
      for (const route of routes) {
        if (
          !route._source.destinationCity ||
          route._source.destinationCity === null ||
          route._source.destinationCity === undefined
        )
          continue;

        destinations.add({
          id: route._id,
          ...route._source
        });

        pricesIDs.add(`${route._id}-oneway`);
        pricesIDs.add(`${route._id}-round`);
      }

      if (destinations.size < Number(limit)) {
        const nextIterations = await elasticsearch.scroll({
          scroll_id: scrollID,
          scroll: '1m'
        });

        scrollID = nextIterations._scroll_id;
        routes = nextIterations.hits.hits;
      }
    }

    if (scrollID) {
      try {
        await elasticsearch.clearScroll({ scroll_id: scrollID });
      } catch (error) {
        logger.warn('Failed to clear scroll context:', error.meta.body);
      }
    }

    let slicedDestinations: any[] = Array.from(destinations).slice(
      0,
      Number(limit)
    );
    const destinationsCodes = slicedDestinations.map(
      (item: any) => item.destinationCity
    );

    const [
      {
        hits: { hits: prices }
      },
      {
        hits: { hits: places }
      }
    ] = await Promise.all([
      elasticsearch.search({
        index: `maps`,
        body: {
          query: {
            bool: {
              must: [
                {
                  terms: {
                    _id: Array.from(pricesIDs)
                  }
                }
              ],
              must_not: [
                {
                  term: {
                    'filters.prices.min': 0
                  }
                },
                {
                  term: {
                    'filters.prices.max': 0
                  }
                }
              ]
            }
          }
        },
        size: Number(limit) * 100
      }),
      elasticsearch.search({
        index: `places`,
        body: {
          query: {
            bool: {
              should: [
                {
                  terms: {
                    'code.keyword': destinationsCodes
                  }
                }
              ],
              filter: {
                match: {
                  placeType: 'city'
                }
              }
            }
          }
        },
        size: Number(limit) * 100
      }),
      Image.find({
        filename: {
          $in: destinationsCodes
        }
      })
    ]);

    const mappedPrices = prices.reduce((acc, price) => {
      const data: any = price._source;

      if (!acc[`${data.origin}-${data.destination}`]) {
        acc[`${data.origin}-${data.destination}`] = {};
      }

      if (
        price._source['filters']['prices']['min'] === null ||
        price._source['filters']['prices']['max'] === null
      ) {
        acc[`${data.origin}-${data.destination}`] = undefined;
        return acc;
      }

      acc[`${data.origin}-${data.destination}`][data.tripType] =
        convertCurrency(
          price._source['filters']['prices']['min'],
          'USD'
        ).toFixed(2);
      acc[`${data.origin}-${data.destination}`][data.tripType] === '0.00'
        ? (acc[`${data.origin}-${data.destination}`][data.tripType] = '')
        : acc[`${data.origin}-${data.destination}`][data.tripType];

      return acc;
    }, {});

    const uniqueCountries = {};

    slicedDestinations = await Promise.all(
      slicedDestinations.map(async (item) => {
        const matchingPlace = places.find(
          (place: any) => place._source.code === item.destinationCity
        );

        if (mappedPrices[item.id]) {
          if (matchingPlace) {
            const countrycode = matchingPlace._source['countryCode'];

            if (!uniqueCountries[countrycode]) {
              uniqueCountries[countrycode] = true;

              try {
                const country = await Country.findOne({
                  code: countrycode
                }).exec();
                if (country) {
                  return {
                    ...item,
                    prices: mappedPrices[item.id],
                    country: {
                      code: countrycode,
                      name: country.name
                    },
                    image:
                      'https://storage.googleapis.com/travolic-bucket/default_trending.jpeg'
                  };
                }
              } catch (error) {
                logger.error('Failed to fetch country or image:', error);
                return null;
              }
            }
          }
        }
        return null;
      })
    );

    const filteredResults = slicedDestinations.filter((item) => item !== null);
    return res.json(filteredResults);
  } catch (error) {
    logger.error('Error in topCountries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// the cheapestflightsSearch function from elastic-search
export const cheapestflightsSearch = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = dynamicPageSectionsSchema.validate(req.query);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const {
    origin,
    orig_type,
    destination,
    dest_type,
    currency,
    language,
    limit
  } = value;

  if (!CurrencyEnum[currency]) {
    return res.json({
      chepestFlights: []
    });
  }

  const cacheKey = `cheapestflightsSearch_${origin}_${orig_type}_${currency}_${language}_${limit}${
    destination && dest_type ? `_${destination}_${dest_type}` : ''
  }`;

  const cachedData = await getJSON(cacheKey);
  if (cachedData) {
    return res.json({
      chepestFlights: cachedData
    });
  }

  let originCondition, destinationCondition, originDestinationConditions;

  // conditions for origin
  if (orig_type === 'airport') {
    originCondition = {
      match: { 'legs.origin': origin }
    };
  } else if (orig_type === 'city') {
    originCondition = {
      match: { 'legs.originCityCode': origin }
    };
  } else if (orig_type === 'country') {
    originCondition = {
      match: { 'legs.originCountryCode': origin }
    };
  }

  // conditions for destination
  if (destination) {
    if (dest_type === 'airport') {
      destinationCondition = {
        match: { 'legs.destination': destination }
      };
    } else if (dest_type === 'city') {
      destinationCondition = {
        match: { 'legs.destinationCityCode': destination }
      };
    } else if (dest_type === 'country') {
      destinationCondition = {
        match: { 'legs.destinationCountryCode': destination }
      };
    }
  }

  if (destinationCondition) {
    originDestinationConditions = [
      { match: { tripType: 'oneway' } },
      { match: { adults: 1 } },
      { match: { children: 0 } },
      { match: { infants: 0 } },
      { exists: { field: 'prices' } },
      { range: { 'prices.direct': { gt: 0 } } },
      originCondition,
      destinationCondition,
      { range: { 'legs.departure': { gte: 'now+1d/d' } } }
    ];
  } else if (!destinationCondition) {
    originDestinationConditions = [
      { match: { tripType: 'oneway' } },
      { match: { adults: 1 } },
      { match: { children: 0 } },
      { match: { infants: 0 } },
      { exists: { field: 'prices' } },
      { range: { 'prices.direct': { gt: 0 } } },
      originCondition,
      { range: { 'legs.departure': { gte: 'now+1d/d' } } }
    ];
  }

  const elastictSearchFilterObj = {
    index: `flight_searches`,
    body: {
      query: {
        bool: {
          must: originDestinationConditions
        }
      }
    },
    size: Number(100) // 100
  };

  const { hits } = await elasticsearch.search(elastictSearchFilterObj),
    flightsValues = hits.hits;

  // this for typescript type in AirlineInfo interface
  const airlinesObj: Record<string, AirlineInfo> = {},
    convertCurrency = await currencyConverter(currency);

  for (const flightItem of flightsValues) {
    const flightItemId = flightItem._id,
      airlinesPrices = flightItem._source['prices']['airlines'];

    if (CurrencyEnum[flightItem._source['currency']]) {
      for (const airlinePrice of airlinesPrices) {
        let convertedPrice;
        if (currency !== flightItem._source['currency']) {
          convertedPrice = Number(
            convertCurrency(
              airlinePrice.amount,
              flightItem._source['currency']
            ).toFixed(2)
          );
        } else {
          convertedPrice = airlinePrice.amount;
        }

        airlinesObj[airlinePrice.code + '_' + airlinePrice.amount] = {
          airlineCode: airlinePrice.code,
          airlineAmount: convertedPrice,
          flightCurrency: flightItem._source['currency'],
          flightItemId: flightItemId
        };
      }
    }
  }

  // Convert to array of [key, value] pairs
  const entries = Object.entries(airlinesObj);

  // Sort based on the `airlineAmount`
  entries.sort((a, b) => a[1].airlineAmount - b[1].airlineAmount);

  // Convert back to an object
  const sortedObj = entries.reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});

  // the final array which contains the data
  const chepestFlights = [];

  // Get the keys from the object
  const keys = Object.keys(sortedObj);
  let destinationExisted;

  const originExisted = checkOrigDestExisted(orig_type, origin);

  if (destination) {
    destinationExisted = checkOrigDestExisted(dest_type, destination);
  } else {
    destinationExisted = true;
  }

  if (originExisted && destinationExisted) {
    for (let counter = 0; counter < Math.min(keys.length, limit); counter++) {
      const key = keys[counter];
      const airlineValue = sortedObj[key];
      const flight = findFlightSourceById(
        airlineValue.flightItemId,
        flightsValues
      );

      try {
        const airlineData = await Airline.findOne(
          { code: airlineValue.airlineCode },
          { name: 1, image: 1 }
        );

        let originData, destinationData;
        if (orig_type === 'airport') {
          originData = await Airport.findOne(
            { code: flight['legs'][0].origin },
            { name: 1, translation: 1, code: 1, city: 0 }
          );
        } else if (orig_type === 'city' || orig_type === 'country') {
          originData = await City.findOne(
            { code: flight['legs'][0].originCityCode },
            { name: 1, translation: 1, code: 1, country: 0, image: 0 }
          );
        }

        if (destination && dest_type === 'airport') {
          destinationData = await Airport.findOne(
            { code: flight['legs'][0].destination },
            { name: 1, translation: 1, code: 1, city: 0 }
          );
        } else if (
          (destination && (dest_type === 'city' || dest_type === 'country')) ||
          !destination
        ) {
          destinationData = await City.findOne(
            { code: flight['legs'][0].destinationCityCode },
            { name: 1, translation: 1, code: 1, country: 0, image: 0 }
          );
        }

        originData = TranslationService.translate(originData, language);

        destinationData = TranslationService.translate(
          destinationData,
          language
        );

        const flightLegsObj = {
          origin: originData.code,
          destination: destinationData.code
        };

        const airlineDataObj = {
          name: airlineData.name,
          image_url: airlineData.image.url
        };

        const flightObject = {
          tripType: flight['tripType'],
          legs: flightLegsObj,
          departure: flight['legs'][0].departure,
          price: airlineValue.airlineAmount,
          airline: airlineDataObj
        };

        chepestFlights.push(flightObject);
      } catch {
        return error;
      }
    }
  }

  // Store the array in the cache with the generated key
  await setJSON(cacheKey, chepestFlights, {
    duration: moment.duration({
      minutes: cacheTime
    })
  });

  return res.json({
    chepestFlights
  });
};
export const popularFlight = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { origin, destination, orig_type, dest_type, currency } =
      req.query as {
        origin?: string;
        destination?: string;
        orig_type?: string;
        dest_type?: string;
        currency: string;
      };

    if (!CurrencyEnum[currency]) {
      return next(new AppError('No results found', 404));
    }

    const cacheKey = `popularFlight_${origin}_${orig_type}_${currency}${
      destination && dest_type ? `_${destination}_${dest_type}` : ''
    }`;

    const cachedData = await getJSON(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const convertCurrency = await currencyConverter(currency as string);

    const legsQuery: Record<string, string> = {
      airport: 'origin',
      city: 'originCityCode',
      country: 'originCountryCode'
    };

    const legsDestinationQuery: Record<string, string> = {
      airport: 'destination',
      city: 'destinationCityCode',
      country: 'destinationCountryCode'
    };

    const queryBody: any = {
      query: {
        bool: {
          must: [
            { range: { 'prices.direct': { gt: 0 } } },
            { term: { 'tripType.keyword': 'oneway' } },
            { term: { adults: 1 } }
          ]
        }
      }
    };

    if (origin && orig_type) {
      queryBody.query.bool.must.push({
        match: { [`legs.${legsQuery[orig_type]}`]: origin }
      });
    }

    if (destination && dest_type) {
      queryBody.query.bool.must.push({
        match: { [`legs.${legsDestinationQuery[dest_type]}`]: destination }
      });
    }

    const initIterations = await elasticsearch.search({
      index: `flight_searches`,
      size: 10,
      scroll: '1m',
      body: queryBody,
      sort: [{ 'prices.direct': { order: 'asc' } }]
    });

    let scrollID = initIterations._scroll_id;
    const flightData = initIterations.hits.hits;

    if (flightData.length === 0) {
      await elasticsearch.clearScroll({ scroll_id: scrollID });
      return next(new AppError('No results found', 404));
    }

    while (flightData.length < 10) {
      const nextIterations = await elasticsearch.scroll({
        scroll_id: scrollID,
        scroll: '1m'
      });

      const nextFlightData = nextIterations.hits.hits;

      if (nextFlightData.length === 0) break;

      for (const route of nextFlightData) {
        if (route._source['legs'][0].origin !== origin) {
          continue;
        }
        flightData.push(route);
      }

      scrollID = nextIterations._scroll_id;
    }

    await elasticsearch.clearScroll({ scroll_id: scrollID }); // Clear scroll context after usage

    if (flightData.length > 0) {
      const results = flightData.map((item) => ({
        PopularFlights: {
          origin: item._source['legs'][0]['origin'],
          destination: item._source['legs'][0]['destination'],
          tripType: item._source['tripType'],
          cabinClass: item._source['cabinClass'],
          departure: item._source['legs'][0]['departure'],
          price: convertCurrency(
            item._source['prices']['direct'],
            item._source['currency']
          ).toFixed(2)
        }
      }));

      // Store the array in the cache with the generated key
      await setJSON(cacheKey, results, {
        duration: moment.duration({
          minutes: cacheTime
        })
      });

      return res.json(results);
    } else {
      return next(new AppError('No results found', 404));
    }
  } catch (err) {
    return next(err);
  }
};

export const flightInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { origin, destination, orig_type, dest_type, currency } = req.query as {
    origin?: string;
    destination?: string;
    orig_type?: string;
    dest_type?: string;
    currency: string;
  };

  if (!CurrencyEnum[currency]) {
    return next(new AppError('No results found', 404));
  }

  const cacheKey = `flightInfo_${origin}_${orig_type}_${currency}${
    destination && dest_type ? `_${destination}_${dest_type}` : ''
  }`;

  const cachedData = await getJSON(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  const convertCurrency = await currencyConverter(currency as string);

  const legsQuery: Record<string, string> = {
    airport: 'origin',
    city: 'originCityCode',
    country: 'originCountryCode'
  };

  const legsDestinationQuery: Record<string, string> = {
    airport: 'destination',
    city: 'destinationCityCode',
    country: 'destinationCountryCode'
  };

  const queryBody: any = {
    query: {
      bool: {
        must: [
          { range: { 'prices.direct': { gt: 0 } } },
          { term: { 'tripType.keyword': 'oneway' } },
          { term: { adults: 1 } }
        ]
      }
    }
  };

  if (origin && orig_type) {
    queryBody.query.bool.must.push({
      match: { [`legs.${legsQuery[orig_type]}`]: origin }
    });
  }

  if (destination && dest_type) {
    queryBody.query.bool.must.push({
      match: { [`legs.${legsDestinationQuery[dest_type]}`]: destination }
    });
  }

  try {
    const {
      hits: { hits: flightData }
    } = await elasticsearch.search({
      index: `flight_searches`,
      size: 1,
      scroll: '1m',
      body: queryBody,
      sort: [{ 'prices.direct': { order: 'asc' } }]
    });
    if (flightData.length === 0) {
      return next(new AppError('No results found', 404));
    }

    const {
      hits: { hits: flightCount }
    } = await elasticsearch.search({
      index: `flight_searches`,
      body: {
        query: {
          bool: {
            must: [
              { range: { timestamp: { gte: 'now-7d', lte: 'now' } } },
              {
                term: {
                  'legs.origin.keyword': flightData[0]._source['legs'][0]
                    .origin as string
                }
              },
              {
                term: {
                  'legs.destination.keyword': flightData[0]._source['legs'][0]
                    .destination as string
                }
              }
            ]
          }
        }
      }
    });

    const airlineCode = flightData[0]._source['prices'].airlines
      .filter((airline) => airline.amount === flightData[0].sort[0])
      .map((airline) => airline.code);
    const airlineName = await Airline.findOne({ code: airlineCode[0] });
    const monthName = new Date(
      flightData[0]._source['timestamp']
    ).toLocaleString('en-US', { month: 'long' });
    const results = {
      FlightInfo: {
        Origin: flightData[0]._source['legs'][0].origin,
        Destination: flightData[0]._source['legs'][0].destination,
        Price: convertCurrency(
          flightData[0].sort[0],
          flightData[0]._source['currency']
        ).toFixed(2),
        currency: currency,
        Airline: airlineCode[0],
        CheapestMonth: monthName,
        FlightPerWeekCount: flightCount.length,
        AirlineName: airlineName.name
      }
    };

    // Store the array in the cache with the generated key
    await setJSON(cacheKey, results, {
      duration: moment.duration({
        minutes: cacheTime
      })
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// the cheapestAirlinesPrices function from elastic-search
export const cheapestAirlinesPrices = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = dynamicPageSectionsSchema.validate(req.query);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const {
    origin,
    orig_type,
    destination,
    dest_type,
    currency,
    language,
    limit
  } = value;

  if (!CurrencyEnum[currency]) {
    return res.json({
      chepestAirlinesPrices: []
    });
  }

  const cacheKey = `cheapestAirlinesPrices_${origin}_${orig_type}_${currency}_${language}_${limit}${
    destination && dest_type ? `_${destination}_${dest_type}` : ''
  }`;

  const cachedData = await getJSON(cacheKey);
  if (cachedData) {
    return res.json({
      chepestAirlinesPrices: cachedData
    });
  }

  let originCondition, destinationCondition, originDestinationConditions;

  // conditions for origin
  if (orig_type === 'airport') {
    originCondition = {
      match: { 'legs.origin': origin }
    };
  } else if (orig_type === 'city') {
    originCondition = {
      match: { 'legs.originCityCode': origin }
    };
  } else if (orig_type === 'country') {
    originCondition = {
      match: { 'legs.originCountryCode': origin }
    };
  }

  // conditions for destination
  if (destination) {
    if (dest_type === 'airport') {
      destinationCondition = {
        match: { 'legs.destination': destination }
      };
    } else if (dest_type === 'city') {
      destinationCondition = {
        match: { 'legs.destinationCityCode': destination }
      };
    } else if (dest_type === 'country') {
      destinationCondition = {
        match: { 'legs.destinationCountryCode': destination }
      };
    }
  }

  if (destinationCondition) {
    originDestinationConditions = [
      { match: { tripType: 'oneway' } },
      { match: { adults: 1 } },
      { match: { children: 0 } },
      { match: { infants: 0 } },
      { exists: { field: 'prices' } },
      {
        range: {
          'prices.direct': {
            gt: 0
          }
        }
      },
      originCondition,
      destinationCondition,
      {
        range: {
          'legs.departure': {
            gte: 'now-2M/M', // Start of the month 2 months ago
            lte: 'now' // Up to the current moment
          }
        }
      }
    ];
  } else if (!destinationCondition) {
    originDestinationConditions = [
      { match: { tripType: 'oneway' } },
      { match: { adults: 1 } },
      { match: { children: 0 } },
      { match: { infants: 0 } },
      { exists: { field: 'prices' } },
      { range: { 'prices.direct': { gt: 0 } } },
      originCondition,
      { range: { 'legs.departure': { gte: 'now-2M/M', lte: 'now' } } }
    ];
  }

  const elastictSearchFilterObj = {
    index: `flight_searches`,
    body: {
      query: {
        bool: {
          must: originDestinationConditions
        }
      }
    },
    size: Number(100) // 100
  };

  const { hits } = await elasticsearch.search(elastictSearchFilterObj),
    flightsValues = hits.hits;

  // Initialize airlinesObj with the correct type
  const airlinesObj: AirlinesObject = {},
    convertCurrency = await currencyConverter(currency);

  for (const flightItem of flightsValues) {
    const flightItemId = flightItem._id,
      airlinesPrices = flightItem._source['prices']['airlines'];

    if (CurrencyEnum[flightItem._source['currency']]) {
      for (const airlinePrice of airlinesPrices) {
        // Check if the key exists, if not initialize it with an empty array
        if (!airlinesObj[airlinePrice.code]) {
          airlinesObj[airlinePrice.code] = [];
        }

        let convertedPrice;
        if (currency !== flightItem._source['currency']) {
          convertedPrice = Number(
            convertCurrency(
              airlinePrice.amount,
              flightItem._source['currency']
            ).toFixed(2)
          );
        } else {
          convertedPrice = airlinePrice.amount;
        }

        // Append the new object to the array
        airlinesObj[airlinePrice.code].push({
          airlineCode: airlinePrice.code,
          airlineAmount: convertedPrice,
          flightCurrency: flightItem._source['currency'],
          flightItemId: flightItemId
        });
      }
    }
  }

  const sortedAirlinesArr = [];
  for (const airlineKey in airlinesObj) {
    const airlineArr = airlinesObj[airlineKey];
    airlineArr.sort((a, b) => a.airlineAmount - b.airlineAmount);
    sortedAirlinesArr.push(airlineArr[0]);
  }

  sortedAirlinesArr.sort((a, b) => a.airlineAmount - b.airlineAmount);

  // the final array which contains the data
  const chepestAirlinesPrices = [];
  let destinationExisted;

  const originExisted = checkOrigDestExisted(orig_type, origin);

  if (destination) {
    destinationExisted = checkOrigDestExisted(dest_type, destination);
  } else {
    destinationExisted = true;
  }

  if (originExisted && destinationExisted) {
    for (
      let counter = 0;
      counter < Math.min(sortedAirlinesArr.length, limit);
      counter++
    ) {
      const airlineValue = sortedAirlinesArr[counter];
      const flight = findFlightSourceById(
        airlineValue.flightItemId,
        flightsValues
      );

      try {
        const airlineData = await Airline.findOne(
          { code: airlineValue.airlineCode },
          { name: 1, image: 1 }
        );

        const airlineDataObj = {
          name: airlineData.name,
          image_url: airlineData.image.url
        };

        const flightObject = {
          departure: flight['legs'][0].departure,
          price: airlineValue.airlineAmount,
          airline: airlineDataObj
        };

        chepestAirlinesPrices.push(flightObject);
      } catch {
        return error;
      }
    }
  }

  // Store the array in the cache with the generated key
  await setJSON(cacheKey, chepestAirlinesPrices, {
    duration: moment.duration({
      minutes: cacheTime
    })
  });

  return res.json({
    chepestAirlinesPrices
  });
};

// the cheapestFlightsPerMonths function from elastic-search
export const cheapestFlightsPerMonths = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = dynamicPageSectionsSchema.validate(req.query);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const { origin, orig_type, destination, dest_type, currency } = value;

  const cacheKey = `cheapestFlightsPerMonths_${origin}_${orig_type}_${currency}${
    destination && dest_type ? `_${destination}_${dest_type}` : ''
  }`;

  const cachedData = await getJSON(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  if (!CurrencyEnum[currency]) {
    return res.json({
      cheapestFlgihtsPerMonths: {}
    });
  }

  const legsQuery: Record<string, string> = {
    airport: 'origin',
    city: 'originCityCode',
    country: 'originCountryCode'
  };

  const legsDestinationQuery: Record<string, string> = {
    airport: 'destination',
    city: 'destinationCityCode',
    country: 'destinationCountryCode'
  };

  const queryBody: any = {
    query: {
      bool: {
        must: [
          { match: { tripType: 'oneway' } },
          { match: { adults: 1 } },
          { match: { children: 0 } },
          { match: { infants: 0 } },
          { exists: { field: 'prices' } }
        ],
        should: [
          { range: { 'prices.direct': { gt: 0 } } },
          { range: { 'prices.oneStop': { gt: 0 } } },
          { range: { 'prices.moreThanOneStop': { gt: 0 } } }
        ]
      }
    }
  };

  if (origin && orig_type) {
    queryBody.query.bool.must.push({
      match: { [`legs.${legsQuery[orig_type]}`]: origin }
    });
  }

  if (destination && dest_type) {
    queryBody.query.bool.must.push({
      match: { [`legs.${legsDestinationQuery[dest_type]}`]: destination }
    });
  }

  const monthsFlightsPrices = {},
    // Get the current date
    currentDate = new Date(),
    convertCurrency = await currencyConverter(currency);

  for (let monthCounter = 0; monthCounter <= 11; monthCounter++) {
    let lteVar, gteVar;
    if (monthCounter === 0) {
      lteVar = 'now';
      gteVar = 'now-1M/M';
    } else {
      lteVar = `now-${monthCounter}M/M`;
      gteVar = `now-${monthCounter + 1}M/M`;
    }
    queryBody.query.bool.must.push({
      range: { 'legs.departure': { gte: gteVar, lte: lteVar } }
    });

    const initIterations = await elasticsearch.search({
      index: `flight_searches`,
      body: queryBody
    });

    // Create a new date object for manipulation
    const date = new Date(currentDate);
    // Set the month to current month - i
    date.setMonth(currentDate.getMonth() - monthCounter);
    // Extract the year and month in YYYY-MM format
    const mon = date.getMonth() + 1; // +1 because getMonth() is zero-based

    const flightsData = initIterations.hits.hits,
      monthFlights = [],
      flightTypes = {
        direct: 0,
        oneStop: 1,
        moreThanOneStop: 2
      };

    if (flightsData && flightsData.length > 0) {
      for (const flight of flightsData) {
        let convertedPrice;
        const flight_source = flight._source,
          pricesTypes = [];

        if (CurrencyEnum[flight_source['currency']]) {
          for (const key in flightTypes) {
            if (flight_source['prices'][key]) {
              const priceTypeObj = {
                price: flight_source['prices'][key],
                currency: flight_source['currency'],
                stopCount: flightTypes[key]
              };
              pricesTypes.push(priceTypeObj);
            }
          }

          if (pricesTypes.length > 1) {
            pricesTypes.sort((a, b) => a.price - b.price);

            if (currency !== flight._source['currency']) {
              convertedPrice = Number(
                convertCurrency(
                  pricesTypes[0]['price'],
                  flight_source['currency']
                ).toFixed(2)
              );
            } else {
              convertedPrice = pricesTypes[0]['price'];
            }

            monthFlights.push(convertedPrice);
          }
        }
      }
    }

    if (monthFlights.length > 0) {
      monthFlights.sort((a, b) => a - b);
      monthsFlightsPrices[mon] = monthFlights[0];
    } else {
      monthsFlightsPrices[mon] = 0;
    }
  }

  const cheapestFlgihtsPerMonthsObj = {
    cheapestFlgihtsPerMonths: monthsFlightsPrices
  };

  // Store the array in the cache with the generated key
  await setJSON(cacheKey, cheapestFlgihtsPerMonthsObj, {
    duration: moment.duration({
      minutes: cacheTime
    })
  });

  return res.json(cheapestFlgihtsPerMonthsObj);
};

// the cheapestFlightsEveryWhere function from elastic-search
export const cheapestFlightsEveryWhere = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = cheapestFlightsEveryWhereSchema.validate(req.query);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const { origin, orig_type, currency, language, limit } = value;

  if (!CurrencyEnum[currency]) {
    return res.json({
      destinationCountries: []
    });
  }

  const legsQuery: Record<string, string> = {
    airport: 'origin',
    city: 'originCityCode',
    country: 'originCountryCode'
  };

  const queryBody: any = {
    query: {
      bool: {
        must: [
          { match: { tripType: 'oneway' } },
          { match: { adults: 1 } },
          { match: { children: 0 } },
          { match: { infants: 0 } },
          { exists: { field: 'prices' } },
          { exists: { field: 'legs.destination' } },
          { exists: { field: 'legs.destinationCountryCode' } },
          { exists: { field: 'legs.destinationCityCode' } }
        ],
        should: [
          { range: { 'prices.direct': { gt: 0 } } },
          { range: { 'prices.oneStop': { gt: 0 } } },
          { range: { 'prices.moreThanOneStop': { gt: 0 } } }
        ]
      }
    }
  };

  if (origin && orig_type) {
    queryBody.query.bool.must.push({
      match: { [`legs.${legsQuery[orig_type]}`]: origin }
    });
  }

  queryBody.query.bool.must.push({
    range: { 'legs.departure': { gte: 'now+1d/d', lte: 'now+2M/d' } }
  });

  const initIterations = await elasticsearch.search({
    index: `flight_searches`,
    body: queryBody,
    size: Number(limit),
    scroll: '1m'
  });

  let scrollID = initIterations._scroll_id,
    flightsData = initIterations.hits.hits;
  const convertCurrency = await currencyConverter(currency),
    destinationCountries = {},
    destinationCountriesKeys = [];

  if (flightsData.length === 0) {
    return next(new AppError('No results found', 404));
  }

  while (destinationCountriesKeys.length < Number(limit)) {
    for (const flight of flightsData) {
      if (CurrencyEnum[flight._source['currency']]) {
        if (destinationCountriesKeys.length < Number(limit)) {
          const flight_source = flight._source,
            countryKey = flight_source['legs'][0]['destinationCountryCode'],
            cityKey = flight_source['legs'][0]['destinationCityCode'],
            pricesTypes = [],
            flightTypes = {
              direct: 0,
              oneStop: 1,
              moreThanOneStop: 2
            };

          for (const key in flightTypes) {
            if (flight_source['prices'][key]) {
              const priceTypeObj = {
                price: flight_source['prices'][key],
                currency: flight_source['currency'],
                stopCount: flightTypes[key]
              };
              pricesTypes.push(priceTypeObj);
            }
          }

          if (pricesTypes.length > 1) {
            pricesTypes.sort((a, b) => a.price - b.price);
          }

          if (countryKey in destinationCountries) {
            let destCountryCities = destinationCountries[countryKey]['cities'];

            if (cityKey in destCountryCities) {
              destCountryCities = {
                [cityKey]: {
                  priceDetails: pricesTypes[0]
                }
              };
            } else {
              destCountryCities[cityKey] = { priceDetails: pricesTypes[0] };
            }
          } else {
            destinationCountries[countryKey] = {
              cities: {
                [cityKey]: { priceDetails: pricesTypes[0] }
              }
            };
          }

          if (!destinationCountriesKeys.includes(countryKey)) {
            destinationCountriesKeys.push(countryKey);
          }

          for (const countryKey in destinationCountries) {
            let countryData = await Country.findOne({ code: countryKey });
            countryData = TranslationService.translate(countryData, language);

            const citiesCountry = destinationCountries[countryKey]['cities'],
              countryPrices = [];

            for (const cityKey in citiesCountry) {
              let cityData = await City.findOne({ code: cityKey });
              cityData = TranslationService.translate(cityData, language);

              const { priceDetails } = citiesCountry[cityKey];
              let convertedPrice;
              if (currency !== priceDetails.currency) {
                convertedPrice = Number(
                  convertCurrency(
                    priceDetails.price,
                    priceDetails.currency
                  ).toFixed(2)
                );
              } else {
                convertedPrice = priceDetails.price;
              }

              const priceDetailsObj = {
                currency,
                price: convertedPrice,
                stopCount: priceDetails.stopCount
              };

              countryPrices.push(priceDetailsObj);

              citiesCountry[cityKey] = {
                name: cityData.name,
                priceDetails: priceDetailsObj
              };

              if (cityData.image) {
                citiesCountry[cityKey]['image'] = {
                  filename: cityData.image.filename,
                  path: cityData.image.path,
                  pathWithFilename: cityData.image.pathWithFilename
                };
              }
            }

            if (countryPrices.length > 1) {
              countryPrices.sort((a, b) => a.price - b.price);
            }

            destinationCountries[countryKey] = {
              name: countryData.name,
              code: countryKey,
              cities: citiesCountry,
              cheapestPrice: countryPrices[0]
            };
          }
        }
      }
    }

    const nextIterations = await elasticsearch.scroll({
      scroll_id: scrollID,
      scroll: '1m'
    });

    scrollID = nextIterations._scroll_id;
    flightsData = nextIterations.hits.hits;
  }

  return res.json({
    destinationCountries
  });
};

// the getFAQsData function from elastic-search
export const getFAQsData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = faqsSchema.validate(req.query);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const { origin, orig_type, destination, dest_type, currency } = value;

  if (!CurrencyEnum[currency]) {
    return res.json({
      faqsData: {}
    });
  }

  const cacheKey = `getFAQsData_${origin}_${orig_type}_${currency}${
    destination && dest_type ? `_${destination}_${dest_type}` : ''
  }`;

  const cachedData = await getJSON(cacheKey);
  if (cachedData) {
    return res.json({ faqsData: cachedData });
  }

  const faqsData = {};

  const legsQuery: Record<string, string> = {
    airport: 'origin',
    city: 'originCityCode',
    country: 'originCountryCode'
  };

  const legsDestinationQuery: Record<string, string> = {
    airport: 'destination',
    city: 'destinationCityCode',
    country: 'destinationCountryCode'
  };

  const queryBody: any = {
    query: {
      bool: {
        must: [
          { match: { tripType: 'oneway' } },
          { match: { adults: 1 } },
          { match: { children: 0 } },
          { match: { infants: 0 } },
          { exists: { field: 'prices' } },
          { range: { 'legs.departure': { gte: 'now+1d/d', lte: 'now+2M/d' } } }
        ],
        should: [
          { range: { 'prices.direct': { gt: 0 } } },
          { range: { 'prices.oneStop': { gt: 0 } } },
          { range: { 'prices.moreThanOneStop': { gt: 0 } } }
        ]
      }
    }
  };

  const originQueryBody = JSON.parse(JSON.stringify(queryBody));
  originQueryBody.query.bool.must.push({
    match: { [`legs.${legsQuery[orig_type]}`]: origin }
  });

  if (origin && orig_type && !destination && !dest_type) {
    const originFlightsSearchInitIterations = await elasticsearch.search({
      index: `flight_searches`,
      body: originQueryBody
    });

    const originFlightsSearchData = originFlightsSearchInitIterations.hits.hits;

    if (originFlightsSearchData.length > 0) {
      faqsData['origin'] = await FAQsMethods(originFlightsSearchData, currency);
    }
  }

  if (origin && orig_type && destination && dest_type) {
    const origDestQueryBodyQueryBody = JSON.parse(
      JSON.stringify(originQueryBody)
    );

    // origin & destination
    origDestQueryBodyQueryBody.query.bool.must.push({
      match: { [`legs.${legsDestinationQuery[dest_type]}`]: destination }
    });

    const originDestinationInitIterations = await elasticsearch.search({
      index: `flight_searches`,
      body: origDestQueryBodyQueryBody
    });

    const originDestinationFlightsSearchData =
      originDestinationInitIterations.hits.hits;

    if (originDestinationFlightsSearchData.length > 0) {
      faqsData['originDestination'] = await FAQsMethods(
        originDestinationFlightsSearchData,
        currency
      );
    }
  }

  // Store the array in the cache with the generated key
  await setJSON(cacheKey, faqsData, {
    duration: moment.duration({
      minutes: cacheTime
    })
  });

  return res.json({
    faqsData
  });
};
