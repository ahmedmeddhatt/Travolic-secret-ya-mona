import { Request, Response, NextFunction } from 'express';
import querystring from 'querystring';
import moment from 'moment';
import axios from 'axios';
import {
  radicalSchema,
  simtexSchema,
  PredictSchema,
  searchFiltersSchema,
  amenitiesSchema,
  seatMapsSchema,
  mediaAlphaAds
} from '../validators/flight.schema';
import { flightSchedulesSchema } from '../validators/OAG.schema';
import currencyConverter from '../middlewares/currencyConverter';
import { programs, calculate } from '../search/wheretocredit';
import { calculate as calculateV2 } from '../search/wheretocreditV2';
import { updateFlightSearch } from '../track';
import { wrapFunction, getMultiKeys, setJSON } from '../utils/cache.util';
import { languageUtil } from '../utils/get-language.util';
import AppError from '../utils/appError.util';
import { MobileUpdate } from '../models';
import {
  createKayakCarRentalPayload,
  createKayakFlightPayload,
  createKayakSession,
  getAdsData,
  transformResults,
  transformResultsInline
} from '../kayak/helpers';
import { countriesList } from '../kayak/countriesList';
import { carsRentalSchema, flightsSchema } from '../validators/kayak.schema';
import { hotelsMediaAlphaAds } from '../validators/hotel.schema';

const {
  SIMTEX_API_URL,
  SIMTEX_API_KEY,
  AIRHINT_API_URL,
  AIRHINT_API_KEY,
  TRAVELBANS_API_URL,
  TRAVELBANS_API_KEY,
  SEATMAP_API_URL,
  SEATMAP_AUTH_URL,
  SEATMAP_PRIVATE_KEY,
  SEATEMAP_APPID,
  RADICAL_API_KEY,
  RADICAL_API_URL,
  SEATMAP_LINK_API_URL,
  SEATMAP_LINK_AUTH_URL,
  SEATMAP_LINK_PRIVATE_KEY,
  SEATMAP_LINK_APPID,
  NODE_ENV,
  HOLIDAYS_API_URL,
  HOLIDAYS_API_KEY,
  OAG_URL,
  OAG_SUBSCRIPTION_KEY,
  SEATMAP_LINK_DISPLAYLANG,
  MEDIAALPHA_URL,
  MEDIAALPHA_API_KEY,
  MEDIAALPHA_PLACEMENT_ID,
  MEDIAALPHA_API_VERSION,
  HOTEL_MEDIAALPHA_URL,
  HOTEL_MEDIAALPHA_API_KEY,
  HOTEL_MEDIAALPHA_PLACEMENT_ID,
  HOTEL_MEDIAALPHA_API_VERSION
} = process.env;

export const flightSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { error, value } = flightSchedulesSchema.validate(req.query);
    if (error) {
      throw new AppError(error.details[0].message, 422);
    }

    const { DepartureDate, DepartureAirport, ArrivalAirport, version } = value;
    const payload = {
      DepartureDate,
      DepartureAirport,
      ArrivalAirport,
      version
    };
    const headers = {
      'Subscription-Key': OAG_SUBSCRIPTION_KEY,
      'Cache-Control': 'no-cache'
    };

    const allFlightSchedulesData = [];
    let nextPageDocURL = `${OAG_URL}?${querystring.stringify(payload)}`;
    while (nextPageDocURL) {
      const response = await axios.get(nextPageDocURL, { headers });
      allFlightSchedulesData.push(...response.data.data);
      nextPageDocURL = response.data.paging.next;
    }

    const allFlightSchedulesDataObj = allFlightSchedulesData.reduce(
      (acc, flight) => {
        acc[flight.flightNumber] = {
          carrierCode: flight.carrierCode.iata,
          flightNumber: flight.flightNumber,
          flightType: flight.FlightType,
          departure: {
            airport: flight.departure.airport.iata,
            terminal: flight.departure.terminal,
            date: flight.departure.date,
            passengerLocalTime: flight.departure.passengerLocalTime
          },
          arrival: {
            airport: flight.arrival.airport.iata,
            terminal: flight.arrival.terminal,
            date: flight.arrival.date,
            passengerLocalTime: flight.arrival.passengerLocalTime
          },
          aircraftType: flight.aircraftType.iata,
          serviceTypeCode: flight.serviceTypeCode.iata,
          codeshare: {
            code: flight.carrierCode.iata
          }
        };
        return acc;
      },
      {}
    );

    return res.status(200).json(allFlightSchedulesDataObj);
  } catch (error) {
    return next(new AppError(error.message, error.status || 500));
  }
};
export const searchPricesFilters = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = searchFiltersSchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const prices: searchFlightPriceFilters = {
    direct: value.direct,
    oneStop: value.oneStop,
    moreThanOneStop: value.moreThanOneStop,
    airlines: value.airlines,
    providers: value.providers
  };

  await updateFlightSearch(req.params.searchId as string, value.status, prices);

  return res.status(200).json({ success: true });
};

export const flyerProgram = async (req: Request, res: Response) =>
  res.status(200).json(await programs());

export const flyerCalculate = async (req: Request, res: Response) =>
  res.status(200).json(await calculate(req.body));

export const flyerCalculateV2 = async (req: Request, res: Response) =>
  res.status(200).json(await calculateV2(req.body));

export const predict = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { error, value } = PredictSchema.validate(req.body);

    if (error) {
      return next(new AppError(error.details[0].message, 422));
    }

    const {
      currentPrice,
      currency,
      airline,
      origin,
      destination,
      departureDate,
      returnDate
    } = value;

    const params = {
      key: AIRHINT_API_KEY,
      ...(currentPrice ? { price: currentPrice } : {}),
      ...(currency ? { currency } : {})
    };

    const requestURL = `${AIRHINT_API_URL}/${airline}/${origin}/${destination}/${departureDate}${
      returnDate ? '/' + returnDate : ''
    }?${querystring.stringify(params)}`;

    const { data } = await axios.get(requestURL);

    res.status(200).json(data);
  } catch (error) {
    return next(new AppError(error, 500));
  }
};

export const covid = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { countries } = req.query;

    const payload = {
      token: TRAVELBANS_API_KEY,
      countries: countries as any
    };

    const results = await axios.get(
      TRAVELBANS_API_URL + querystring.stringify(payload),
      {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8'
        }
      }
    );

    res.status(200).json(results.data);
  } catch (error) {
    return next(new AppError(error, 500));
  }
};

export const radical = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { error, value } = radicalSchema.validate(req.query);

    if (error) {
      return next(new AppError(error.details[0].message, 422));
    }

    const { lat, long, dropoff, pickup, bags, currency } = value;
    const payload = {
      dropoff: `${moment
        .utc(dropoff, 'YYYY-MM-DDTHH:mm:ssZ')
        .format('YYYY-MM-DDTHH:mm:ss')}Z`,
      pickup: `${moment
        .utc(pickup, 'YYYY-MM-DDTHH:mm:ssZ')
        .format('YYYY-MM-DDTHH:mm:ss')}Z`,
      bags: bags as any,
      radius: 10
    };

    const url = `${RADICAL_API_URL}/${lat}/${long}?${querystring.stringify(
      payload
    )}`;

    const { data } = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RADICAL_API_KEY}`
      }
    });

    if (data.storages) {
      const convertCurrency = await currencyConverter(currency);

      for (const storage of data.storages) {
        storage.price.amount = convertCurrency(
          storage.price.amount / 100,
          'EUR'
        ).toFixed(2);
        storage.price.currency = currency;
        storage.price.cents = undefined;
        storage.price.symbol = undefined;
        storage.netPrice.amount = convertCurrency(
          storage.netPrice.amount / 100,
          'EUR'
        ).toFixed(2);
        storage.netPrice.currency = currency;
        storage.netPrice.cents = undefined;
        storage.netPrice.symbol = undefined;
      }
    }

    res.status(200).json(data);
  } catch (err) {
    next(new AppError(err, 500));
  }
};

export const dataPackage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { error, value } = simtexSchema.validate(req.query);

    if (error) {
      return next(new AppError(error.details[0].message, 422));
    }

    const { currency, country } = value;

    const destinations = [
      'AL',
      'DZ',
      'AU',
      'AT',
      'BE',
      'BG',
      'HR',
      'CY',
      'CZ',
      'DK',
      'EE',
      'FI',
      'FR',
      'DE',
      'GR',
      'HK',
      'HU',
      'IS',
      'IE',
      'IL',
      'IT',
      'KZ',
      'KR',
      'LV',
      'LI',
      'LT',
      'LU',
      'MT',
      'NL',
      'NZ',
      'NO',
      'PL',
      'PT',
      'RO',
      'SK',
      'SI',
      'ES',
      'SE',
      'TW',
      'TH',
      'TR',
      'GB',
      'US'
    ];

    if (!destinations.includes(country as string)) {
      return next(new AppError('Country not supported', 422));
    }

    const { data } = await axios.get(
      `${SIMTEX_API_URL}?currency=${currency}&country=${country}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SIMTEX_API_KEY}`
        }
      }
    );

    if (!data || !data['packages'] || data['packages'].length === 0) {
      return next(new AppError('No results found', 404));
    }

    const destinationResults = data['packages'].filter((item: any) =>
      item.coverages.includes(country)
    );

    if (destinationResults) {
      const convertCurrency = await currencyConverter(currency as string);

      data['packages'] = data['packages'].map((item: any) => {
        return {
          ...item,
          price: convertCurrency(item.price, item.currency).toFixed(2),
          currency
        };
      });
    }

    res.status(200).json(destinationResults);
  } catch (err) {
    next(new AppError(err, 500));
  }
};

export const amenitiesPackage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { error, value } = amenitiesSchema.validate(req.body);

    if (error) {
      return next(new AppError(error.details[0].message, 422));
    }

    let { flights } = value;

    let language = languageUtil(req).toUpperCase();

    const flightIds = flights.map(
      ({ id }) => `${id}-${language}-amenities-${NODE_ENV}`
    );

    const flightAmenities = (await getMultiKeys(flightIds))
      .filter((flight) => flight)
      .reduce((acc, cur) => {
        acc[cur.id] = cur;
        return acc;
      }, {});

    flights = flights.filter((flight) => !flightAmenities[flight.id]);

    if (flights.length > 0) {
      const { data } = await axios.get(
        `${SEATMAP_AUTH_URL}?appId=${SEATEMAP_APPID}`,
        {
          headers: {
            Authorization: `Bearer ${SEATMAP_PRIVATE_KEY}`
          }
        }
      );

      const supportedLanguages = [
        'EN',
        'DE',
        'RU',
        'CN',
        'ES',
        'FR',
        'IT',
        'NO',
        'DA',
        'SV'
      ];

      if (!supportedLanguages.includes(language)) {
        language = 'EN';
      }

      const payload = {
        flights,
        lang: language,
        units: 'metric',
        featuresList: [
          'plane',
          'cabin',
          'entertainment',
          'foodAndBeverages',
          'power',
          'wifi',
          'co2',
          'baggage'
        ]
      };

      const { data: results } = await axios.post(SEATMAP_API_URL, payload, {
        headers: {
          Authorization: `Bearer ${data.accessToken}`
        }
      });
      if (results.length === 0) {
        return next(new AppError('No results found', 404));
      }

      for (const flight of results) {
        if (flight.error) continue;

        const {
          id,
          plane,
          cabin,
          entertainment,
          foodAndBeverages,
          power,
          wifi,
          co2,
          baggage
        } = flight;
        const amenitie = {
          id,
          plane: {
            id: plane.id,
            brandModel: plane.summary,
            windowSize: plane.windowSize,
            aircraftType:
              plane.isWideBody === true ? 'Wide Body' : 'Narrow Body'
          },
          cabin,
          ...(entertainment &&
            entertainment.deliveryType && {
              entertainment: {
                deliveryType: entertainment.deliveryType,
                availability: entertainment.summary
              }
            }),
          ...(foodAndBeverages &&
            foodAndBeverages.foodCost && {
              availability: foodAndBeverages.foodSummary,
              foodCost: foodAndBeverages.foodCost
            }),
          power: {
            availability: power.summary
          },
          wifi: {
            availability: wifi.summary
          },
          co2,
          baggage: {
            checkinItemInfoUrl: baggage[0].checkinItemInfoUrl,
            cabinItemInfoUrl: baggage[0].cabinItemInfoUrl
          }
        };

        flightAmenities[id] = amenitie;

        await setJSON(`${id}-${language}-amenities-${NODE_ENV}`, amenitie, {
          duration: moment.duration({
            minutes: 48 * 60
          })
        });
      }
    }

    return res.status(200).json(flightAmenities);
  } catch (err) {
    next(new AppError(err, 500));
  }
};

export const seatMaps = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { error, value } = seatMapsSchema.validate(req.body);

    if (error) {
      return next(new AppError(error.details[0].message, 422));
    }

    let { flights } = value;
    const languages = [
      'EN',
      'DE',
      'RU',
      'CN',
      'ES',
      'FR',
      'IT',
      'NO',
      'DA',
      'SV',
      'PL'
    ];
    const lang = languages.includes(value.lang) ? value.lang : 'EN';
    const flightIds = flights.map(
      ({ id }) => `${id}-seatmaplinklang-${NODE_ENV}-${lang}`
    );

    const flightSeatMaps = (await getMultiKeys(flightIds))
      .filter((flight) => flight)
      .reduce((acc, cur) => {
        acc[cur.id] = cur;
        return acc;
      }, {});

    flights = flights.filter((flight) => !flightSeatMaps[flight.id]);

    if (flights.length > 0) {
      const { data } = await axios.get(
        `${SEATMAP_LINK_AUTH_URL}?appId=${SEATMAP_LINK_APPID}`,
        {
          headers: {
            Authorization: `Bearer ${SEATMAP_LINK_PRIVATE_KEY}`
          }
        }
      );
      const flightLists = Array.from(
        { length: Math.ceil(flights.length / 6) },
        (_, i) => flights.slice(i * 6, i * 6 + 6)
      );

      const seatMapLinks = await Promise.all(
        flightLists.map(async (flight) => {
          const response = await axios
            .post(
              SEATMAP_LINK_API_URL,
              {
                flights: flight,
                lang: lang,
                units: 'metric',
                colorTheme: 'travolic',
                featuresList: ['seatMapLink']
              },
              {
                headers: {
                  Authorization: `Bearer ${data.accessToken}`
                }
              }
            )
            .then((response) => response.data)
            .catch(() => {
              return {};
            });
          return response;
        })
      );

      if (Object.keys(seatMapLinks).length === 0 || !seatMapLinks) {
        return res.status(200).json({});
      }
      for (const flight of seatMapLinks.flat()) {
        if (flight.error) continue;

        const { id } = flight;
        let { seatmapLink } = flight;
        const url = `${SEATMAP_LINK_DISPLAYLANG}${
          seatmapLink.split('/')[7]
        }/redirect?language=${lang}`;
        seatmapLink = url;
        const seatmapId = `${id}-seatmaplinklang-${NODE_ENV}-${lang}`;
        await setJSON(
          seatmapId,
          {
            id,
            seatmapLink
          },
          {
            duration: moment.duration({
              minutes: 60
            })
          }
        );

        flightSeatMaps[id] = {
          seatmapLink
        };
      }
    }

    return res.status(200).json(flightSeatMaps);
  } catch (err) {
    next(new AppError(err, 500));
  }
};

export const publicHolidays = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { year, country, language } = req.query;
    const supportedLanguages = [
      'af',
      'ak',
      'am',
      'ar',
      'as',
      'ay',
      'az',
      'be',
      'bg',
      'bh',
      'bn',
      'bs',
      'ca',
      'ceb',
      'co',
      'cs',
      'cy',
      'da',
      'de',
      'dv',
      'ee',
      'el',
      'en',
      'eo',
      'es',
      'et',
      'eu',
      'fa',
      'fi',
      'fr',
      'fy',
      'ga',
      'gd',
      'gl',
      'gn',
      'gu',
      'ha',
      'haw',
      'he',
      'hi',
      'hmn',
      'hr',
      'ht',
      'hu',
      'hy',
      'id',
      'ig',
      'is',
      'it',
      'ja',
      'jw',
      'ka',
      'kk',
      'km',
      'kn',
      'ko',
      'kri',
      'ku',
      'ky',
      'la',
      'lb',
      'lg',
      'ln',
      'lo',
      'lt',
      'lv',
      'mg',
      'mi',
      'mk',
      'ml',
      'mn',
      'mr',
      'ms',
      'mt',
      'my',
      'ne',
      'nl',
      'no',
      'nso',
      'ny',
      'om',
      'or',
      'pa',
      'pl',
      'ps',
      'pt',
      'qu',
      'ro',
      'ru',
      'rw',
      'sa',
      'sd',
      'si',
      'sk',
      'sl',
      'sm',
      'sn',
      'so',
      'sq',
      'sr',
      'st',
      'su',
      'sv',
      'sw',
      'ta',
      'te',
      'tg',
      'th',
      'ti',
      'tk',
      'tl',
      'tr',
      'ts',
      'tt',
      'ug',
      'uk',
      'ur',
      'uz',
      'vi',
      'xh',
      'yi',
      'yo',
      'zh',
      'zu'
    ];

    if (!supportedLanguages.includes(language as string)) {
      return next(new AppError('Language not supported', 400));
    }

    const holidays = async (
      country: string,
      year: number,
      language: string
    ) => {
      const url = `${HOLIDAYS_API_URL}?key=${HOLIDAYS_API_KEY}&country=${country}&year=${year}&language=${language}`;
      const { data } = await axios.get(url);

      return data.holidays;
    };

    const cachedResults = wrapFunction(holidays, {
      prefix: `holidays-${year}-${country}-${language}`,
      duration: moment.duration(4, 'weeks'),
      args: false
    });

    const data = await cachedResults(country, year, language);

    if (Object.keys(data).length === 0) {
      return next(new AppError('No holidays found', 404));
    }

    return res.status(200).json({
      status: 'success',
      holidays: data
    });
  } catch (err) {
    next(new AppError(err, 500));
  }
};

export const apiUpdateStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { platform, buildNumber, appVersion } = req.query;

  const mobileUpdateDoc = await MobileUpdate.findOne({
    platform,
    buildNumber,
    appVersion
  });

  if (!mobileUpdateDoc) {
    return next(new AppError('No mobile update found', 404));
  }

  return res.status(200).json({
    isHasUpdate: mobileUpdateDoc.hasUpdate,
    isMustUpdate: mobileUpdateDoc.mustUpdate
  });
};

export const getMediaAlphaAds = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = mediaAlphaAds.validate(req.body);

  if (error) {
    return res.status(400).json({ msg: 'Data is missing.' });
  }
  const CABIN_MAP = {
    premium_economy: 'Premium Economy',
    business: 'Business',
    first: 'First',
    Economy: 'Economy'
  };
  const payload = {
    api_token: MEDIAALPHA_API_KEY,
    placement_id: MEDIAALPHA_PLACEMENT_ID,
    version: MEDIAALPHA_API_VERSION,
    local_hour: value.localHour,
    ip: req.ip ? req.ip : '161.185.160.93',
    ua: value.ua,
    url: value.url,
    locale: value.locale,
    sub_1: value.sub_1,
    sub_2: value.sub_2,
    sub_3: value.sub_3,
    data: {
      add_car: 0,
      add_hotel: 0,
      flexible_dates: 0,
      flights: value.flights,
      max_stops: 2,
      nearby_airports: 1,
      num_adults: value.adults,
      num_children: value.children,
      num_infants_in_lap: value.infants,
      num_infants_in_seat: 0,
      num_seniors: 0,
      preferred_cabin_class: CABIN_MAP[value.cabin],
      refundable_fare: 0
    }
  };
  const data = await axios
    .post(MEDIAALPHA_URL, payload)
    .then((res) => res.data)
    .catch(() => {
      return next(new AppError('No Data is found', 404));
    });
  res.status(200).json(data);
};

export const kayakCompareToFlights = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = flightsSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ msg: 'Data is missing.' });
  }

  if (value.country !== 'US') {
    return res.status(401).json({ msg: 'Only On US Country' });
  }

  const domain = countriesList['US'].fullDomainName;

  const userAgent = req.headers['user-agent'];

  const sid = await createKayakSession(domain, userAgent, next);

  const adsFlightUrl = `${domain}/i/api/ads/compareTo/v1/flight/list?_sid_=${sid}`;

  const data = await getAdsData(
    createKayakFlightPayload(value, 'compareTo'),
    adsFlightUrl,
    userAgent
  );

  if (!data) {
    return next(new AppError('No Data is found', 404));
  }

  return res.status(200).json(transformResults(data, domain));
};

export const kayakCompareToCarRental = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = carsRentalSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ msg: 'Data is missing.', error });
  }

  if (value.country !== 'US') {
    return res.status(401).json({ msg: 'Only On US Country' });
  }

  const domain = countriesList['US'].fullDomainName;

  const userAgent = req.headers['user-agent'];

  const sid = await createKayakSession(domain, userAgent, next);

  const adsCompareToHotelsUrl = `${domain}/i/api/ads/compareTo/v1/car/list?_sid_=${sid}`;

  const data = await getAdsData(
    createKayakCarRentalPayload(value),
    adsCompareToHotelsUrl,
    userAgent
  );

  if (!data) {
    return next(new AppError('No Data is found', 404));
  }

  return res.status(200).json(transformResults(data, domain));
};

export const kayakInlineAdsFlights = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = flightsSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ msg: 'Data is missing.' });
  }

  if (!countriesList[value.country]) {
    value.country = 'US';
  }

  const domain = countriesList[value.country].fullDomainName;

  const userAgent = req.headers['user-agent'];

  const sid = await createKayakSession(domain, userAgent, next);

  const adsFlightUrl = `${domain}/i/api/ads/inline/v1/flight/list?_sid_=${sid}`;

  const data = await getAdsData(
    createKayakFlightPayload(value, 'inline'),
    adsFlightUrl,
    userAgent
  );

  if (!data) {
    return next(new AppError('No Data is found', 404));
  }

  return res.status(200).json(transformResultsInline(data, domain));
};

export const getHotelsMediaAlphaAds = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = hotelsMediaAlphaAds.validate(req.body);

  if (error) {
    return res.status(400).json({ msg: 'Data is missing.' });
  }

  let adults_num: number = value.guests.adults,
    children_num: number = value.guests.children,
    rooms_num: number = value.rooms;
  const guestsRooms = [],
    roomInptCount = value.rooms;

  if (roomInptCount) {
    for (let roomCounter = 0; roomCounter < roomInptCount; roomCounter++) {
      if (guestsRooms.length < roomInptCount) {
        const roomAdults = Math.ceil(adults_num / rooms_num);
        const roomChildren = Math.ceil(children_num / rooms_num);
        guestsRooms.push({
          num_adults: roomAdults,
          num_children: roomChildren
        });
        adults_num -= roomAdults;
        children_num -= roomChildren;
        rooms_num--;
      } else {
        break;
      }
    }
  } else {
    guestsRooms.push({
      num_adults: adults_num,
      num_children: children_num
    });
  }

  const payload = {
    api_token: HOTEL_MEDIAALPHA_API_KEY,
    placement_id: HOTEL_MEDIAALPHA_PLACEMENT_ID,
    version: HOTEL_MEDIAALPHA_API_VERSION,
    local_hour: value.localHour,
    ip: req.ip ?? '161.185.160.93',
    ua: value.ua,
    url: value.url,
    locale: value.locale,
    sub_1: value.sub_1,
    sub_2: value.sub_2,
    sub_3: value.sub_3,
    data: {
      check_in_date: value.check_in_date,
      check_out_date: value.check_out_date,
      destination: value.city_name,
      preferred_brand: value.hotels,
      rooms: guestsRooms
    }
  };

  const data = await axios
    .post(HOTEL_MEDIAALPHA_URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then((res) => res.data)
    .catch(() => {
      return next(new AppError('No Data is found', 404));
    });
  res.status(200).json(data);
};
