import { Request, Response, NextFunction } from 'express';
import getIPData from '../utils/ipData.util';
import elasticsearch from '../configs/elasticsearch';
import {
  mapSchema,
  mapOriginSchema,
  mapOriginDestinationSchema
} from '../validators/map.schema';
import TranslationService from '../middlewares/translation';
import currencyConverter from '../middlewares/currencyConverter';
import { Airport, Airline, City } from '../models';
import { languageUtil } from '../utils/get-language.util';
import AppError from '../utils/appError.util';

const generateMapsData = async (
  maps: any[],
  places: any,
  language: string,
  currency: string
) => {
  const convertCurrency = await currencyConverter(currency);
  const airlinesCodes = [];

  maps = maps
    .map((map) => {
      const origin = places[map._source['origin']];
      const destination = places[map._source['destination']];

      if (!origin || !destination) {
        return null;
      }

      const airlines = map._source['filters']['airlines'].map((airline) => {
        airlinesCodes.push(airline.code);
        airline.amount = convertCurrency(airline.amount, 'USD').toFixed(2);
        return airline;
      });

      return {
        origin: {
          code: origin.code,
          name: origin.name[language as string],
          location: {
            type: 'Point',
            coordinates: origin.location
          },
          city: {
            name: origin.phrase[language as string].split(', ')[1],
            code: origin.cityCode
          }
        },
        destination: {
          code: destination.code,
          name: destination.name[language as string],
          location: {
            type: 'Point',
            coordinates: destination.location
          },
          city: {
            name: destination.phrase[language as string].split(', ')[1],
            code: destination.cityCode
          }
        },
        filters: {
          prices: {
            min: convertCurrency(
              map._source['filters']['prices']['min'],
              'USD'
            ).toFixed(2)
          },
          stops: {
            direct: convertCurrency(
              map._source['filters']['stops']['direct'],
              'USD'
            ).toFixed(2),
            oneStop: convertCurrency(
              map._source['filters']['stops']['oneStop'],
              'USD'
            ).toFixed(2),
            moreThanOneStop: convertCurrency(
              map._source['filters']['stops']['moreThanOneStop'],
              'USD'
            ).toFixed(2)
          },
          durations: {
            min: map._source['filters']['durations']['min'],
            max: map._source['filters']['durations']['max']
          },
          airlines
        }
      };
    })
    .filter((map) => map !== null);

  let airlines = await Airline.find({
    code: { $in: airlinesCodes }
  });

  airlines = TranslationService.interceptor(language, airlines);

  return {
    maps,
    airlines
  };
};

const getMapsData = async (airportCode: string, tripType: string) => {
  const initIterations = await elasticsearch.search({
    index: 'maps',
    scroll: '1m',
    size: 1000,
    body: {
      query: {
        bool: {
          must: [
            {
              match: {
                tripType: tripType
              }
            },
            {
              match: {
                origin: airportCode
              }
            }
          ],
          filter: [
            {
              range: {
                'filters.prices.min': {
                  gt: 0
                }
              }
            },
            {
              exists: {
                field: 'filters.prices.min'
              }
            }
          ]
        }
      }
    }
  });
  let scrollID = initIterations._scroll_id;
  let routes: any = initIterations.hits.hits;
  const mapsData = [];

  while (routes.length > 0) {
    mapsData.push(...routes);

    const nextIterations = await elasticsearch.scroll({
      scroll_id: scrollID,
      scroll: '1m'
    });

    scrollID = nextIterations._scroll_id;
    routes = nextIterations.hits.hits;
  }

  return mapsData;
};

const getAirportCodes = (mapsData: any[]) => {
  return mapsData.reduce((acc, map) => {
    acc.push(map._source['origin']);
    acc.push(map._source['destination']);

    return acc;
  }, []);
};

const getPlaces = async (airportCodes: string[]) => {
  const placesData = await elasticsearch.search({
    index: `places`,
    body: {
      query: {
        bool: {
          should: [
            {
              terms: {
                'code.keyword': airportCodes
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
    size: airportCodes.length
  });

  return placesData.hits.hits.reduce((acc, place) => {
    acc[place._source['code']] = place._source;

    return acc;
  }, {});
};

export const getAllMap = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = mapSchema.validate(req.query);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const { location, country_code } = await getIPData(req.ip, 'server');
  const language = languageUtil(req);
  const airports = (
    await Airport.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: location
          },
          $maxDistance: 200.7 * 1000,
          $minDistance: 10
        }
      },
      isActive: true
    })
  ).filter((airport) => airport.city.country.code === country_code);

  if (airports.length === 0) {
    return next(new AppError('No airport found', 404));
  }

  const counts = await Promise.allSettled(
    airports.map((airport) =>
      elasticsearch
        .count({
          index: 'maps',
          body: {
            query: {
              match: {
                origin: airport.code
              }
            }
          }
        })
        .then(({ count }) => ({
          airportCode: airport.code,
          count: count
        }))
        .catch(() => ({ airportCode: airport.code, count: 0 }))
    )
  );

  const { airportCode } = counts
    .filter(({ status }) => status === 'fulfilled')
    .reduce(
      (maxAirport, currentAirport: any) => {
        if (currentAirport.value.count > maxAirport.count) {
          return currentAirport.value;
        } else {
          return maxAirport;
        }
      },
      { airportCode: null, count: -1 }
    );

  if (airportCode === null) {
    return next(new AppError('No data found', 404));
  }

  const mapsData = await getMapsData(airportCode, value.tripType);
  const airportCodes = getAirportCodes(mapsData);
  const places = await getPlaces(airportCodes);

  const { maps, airlines } = await generateMapsData(
    mapsData,
    places,
    language as string,
    value.currency
  );

  return res.json({
    maps,
    airlines
  });
};

export const getMapOrigin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = mapOriginSchema.validate(req.query);

  if (error) {
    return next(new AppError(error.details.message, 422));
  }

  let airports = [];
  const language = languageUtil(req);

  if (value.originPlaceType === 'city') {
    const city = await City.findOne({
      code: value.origin
    });
    const docs = await Airport.find({
      city: city._id,
      isActive: true
    });

    airports = docs.map((doc) => doc.code);
  } else {
    airports.push(value.origin);
  }

  if (airports.length === 0) {
    return next(new AppError('No airport found', 404));
  }

  const counts = await Promise.allSettled(
    airports.map((airport) =>
      elasticsearch
        .count({
          index: 'maps',
          body: {
            query: {
              match: {
                origin: airport
              }
            }
          }
        })
        .then(({ count }) => ({
          airportCode: airport,
          count: count
        }))
        .catch(() => ({ airportCode: airport, count: 0 }))
    )
  );

  const { airportCode } = counts
    .filter(({ status }) => status === 'fulfilled')
    .reduce(
      (maxAirport, currentAirport: any) => {
        if (currentAirport.value.count > maxAirport.count) {
          return currentAirport.value;
        } else {
          return maxAirport;
        }
      },
      { airportCode: null, count: -1 }
    );

  if (airportCode === null) {
    return next(new AppError('No data found', 404));
  }

  const mapsData = await getMapsData(airportCode, value.tripType);
  const airportCodes = getAirportCodes(mapsData);
  const places = await getPlaces(airportCodes);

  const { maps, airlines } = await generateMapsData(
    mapsData,
    places,
    language as string,
    value.currency
  );

  return res.json({
    maps: maps,
    airlines
  });
};

export const getMapOriginDestination = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = mapOriginDestinationSchema.validate(req.query);
  if (error) {
    return next(new AppError(error.details.message, 422));
  }
  const airportsCodesOrigin = [];
  const airportsCodesDest = [];
  const originType = value.originPlaceType;
  const destType = value.destinationPlaceType;
  const [
    {
      hits: { hits: originPlace }
    },
    {
      hits: { hits: destinationPlace }
    }
  ] = await Promise.all([
    elasticsearch.search({
      index: `places`,
      body: {
        query: {
          bool:
            originType === 'airport'
              ? {
                  should: [
                    {
                      match: {
                        code: value.origin as string
                      }
                    },
                    {
                      match: {
                        placeType: 'airport'
                      }
                    }
                  ]
                }
              : {
                  should: [
                    {
                      match: {
                        code: value.origin as string
                      }
                    },
                    {
                      match: {
                        placeType: 'city'
                      }
                    }
                  ]
                }
        }
      }
    }),
    elasticsearch.search({
      index: `places`,
      body: {
        query: {
          bool:
            destType === 'airport'
              ? {
                  should: [
                    {
                      match: {
                        code: value.destination as string
                      }
                    },
                    {
                      match: {
                        placeType: 'airport'
                      }
                    }
                  ]
                }
              : {
                  should: [
                    {
                      match: {
                        code: value.destination as string
                      }
                    },
                    {
                      match: {
                        placeType: 'city'
                      }
                    }
                  ]
                }
        }
      }
    })
  ]);
  if (originPlace[0]._source['placeType'] === 'city') {
    const locationOrigin = originPlace[0]._source['location'];
    const getAirportOrigin = await Airport.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [locationOrigin[0], locationOrigin[1]]
          },
          $minDistance: 10,
          $maxDistance: 70 * 1000
        }
      },
      isActive: true
    });
    getAirportOrigin.forEach((item) => {
      airportsCodesOrigin.push(item.code);
    });
  } else {
    airportsCodesOrigin.push(value.origin);
  }
  if (destinationPlace[0]._source['placeType'] === 'city') {
    const locationDest = destinationPlace[0]._source['location'];
    const getAirportDestination = await Airport.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [locationDest[0], locationDest[1]]
          },
          $minDistance: 10,
          $maxDistance: 50 * 1000
        }
      },
      isActive: true
    });
    getAirportDestination.forEach((item) => {
      airportsCodesDest.push(item.code);
    });
  } else {
    airportsCodesDest.push(value.destination);
  }

  const routes = [];
  for (let i = 0; i < airportsCodesOrigin.length; i++) {
    for (let j = 0; j < airportsCodesDest.length; j++) {
      const route = `${airportsCodesOrigin[i]}-${airportsCodesDest[j]}-${value.tripType}`;
      routes.push(route);
    }
  }
  const language = languageUtil(req);
  const maps = await elasticsearch.search({
    index: `maps`,
    body: {
      query: {
        bool: {
          must: {
            terms: {
              _id: Array.from(routes)
            }
          }
        }
      },
      size: 200
    }
  });
  const mapsResults = maps.hits.hits;
  const convertCurrency = await currencyConverter(value.currency as string);
  const newMaps = [];
  const airlinesCodes = [];
  for (const map of mapsResults) {
    const [
      {
        hits: { hits: originPlaces }
      },
      {
        hits: { hits: destPlaces }
      }
    ] = await Promise.all([
      elasticsearch.search({
        index: `places`,
        body: {
          query: {
            bool: {
              should: [
                {
                  match: {
                    code: map._source['origin']
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
        }
      }),
      elasticsearch.search({
        index: `places`,
        body: {
          query: {
            bool: {
              should: [
                {
                  match: {
                    code: map._source['destination']
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
        }
      })
    ]);
    const originCode = originPlaces[0]._source['code'];
    const originName = originPlaces[0]._source['name'][language as string];
    const originLocation = originPlaces[0]._source['location'];
    const originCityName =
      originPlaces[0]._source['phrase'][language as string].split(', ')[1];
    const originCityCode = originPlaces[0]._source['cityCode'];

    const destCode = destPlaces[0]._source['code'];
    const destName = destPlaces[0]._source['name'][language as string];
    const destLocation = destPlaces[0]._source['location'];
    const destCityName =
      destPlaces[0]._source['phrase'][language as string].split(', ')[1];
    const destCityCode = destPlaces[0]._source['cityCode'];

    const airlines = map._source['filters']['airlines'].map((airline) => {
      airlinesCodes.push(airline.code);
      airline.amount = convertCurrency(airline.amount, 'USD').toFixed(2);
      return airline;
    });

    newMaps.push({
      origin: {
        code: originCode,
        name: originName,
        location: {
          type: 'Point',
          coordinates: originLocation
        },

        city: {
          name: originCityName,
          code: originCityCode
        }
      },
      destination: {
        code: destCode,
        name: destName,
        location: {
          type: 'Point',
          coordinates: destLocation
        },
        city: {
          name: destCityName,
          code: destCityCode
        }
      },
      filters: {
        prices: {
          min: convertCurrency(
            map._source['filters']['prices']['min'],
            'USD'
          ).toFixed(2)
        },
        stops: {
          direct: convertCurrency(
            map._source['filters']['stops']['direct'],
            'USD'
          ).toFixed(2),
          oneStop: convertCurrency(
            map._source['filters']['stops']['oneStop'],
            'USD'
          ).toFixed(2),
          moreThanOneStop: convertCurrency(
            map._source['filters']['stops']['moreThanOneStop'],
            'USD'
          ).toFixed(2)
        },
        durations: {
          min: map._source['filters']['durations']['min'],
          max: map._source['filters']['durations']['max']
        },
        airlines
      }
    });
  }
  let airlines = await Airline.find({
    code: { $in: airlinesCodes }
  });
  airlines = TranslationService.interceptor(language, airlines);

  return res.json({
    maps: newMaps,
    airlines
  });
};
