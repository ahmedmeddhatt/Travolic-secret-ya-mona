import moment from 'moment-timezone';
import {
  Airline,
  Airport,
  Hotel,
  Chain,
  Brand,
  Carrier,
  Station,
  Aircraft,
  City
} from '../models';
import TranslationService from '../middlewares/translation';
import * as cache from '../utils/cache.util';
import logger from '../configs/logger';

const calculateDuration = (
  origin: any,
  destination: any,
  departure: string,
  arrival: string
) => {
  const departureTime = moment
    .tz(departure, 'YYYYMMDDHHmm', origin.timezone)
    .tz('UTC');
  const arrivalTime = moment
    .tz(arrival, 'YYYYMMDDHHmm', destination.timezone)
    .tz('UTC');

  return arrivalTime.diff(departureTime, 'minutes', true);
};

export const addAirportsData = async (
  language: string,
  data: TransformedResult,
  legs: SearchOptionLeg[]
) => {
  data = {
    ...data,
    airports: {},
    filterAirports: {}
  };

  if (Object.keys(data.segments).length === 0) return data;

  const airportsCodes = Object.values(data.segments).reduce((acc, segment) => {
    acc.push(segment.origin, segment.destination);
    return acc;
  }, [] as string[]);

  if (airportsCodes.length === 0) return data;

  const airports = await cache.getMultiKeys(
    airportsCodes.map((code) => `airport-${code}`)
  );

  let foundAirports = await Promise.all(
    airports.map((airport, index) => {
      return airport !== null
        ? Promise.resolve(airport)
        : Airport.findOne({ code: airportsCodes[index] });
    })
  );
  foundAirports = TranslationService.interceptor(language, foundAirports);

  data['foundAirports'] = foundAirports;

  for (let i = 0; i < airportsCodes.length; i++) {
    data['airports'][airportsCodes[i]] =
      foundAirports[i] && foundAirports[i].code
        ? foundAirports[i]
        : {
            code: airportsCodes[i],
            name: airportsCodes[i],
            translation: []
          };
  }

  data['filterAirports'] = {
    departure: {},
    arrival: {}
  };

  async function filterAiportsDataObj(citySecondSecType, legCode) {
    const airportData = await Airport.findOne({ code: legCode });

    if (airportData) {
      const cityId = airportData.city;
      let city = await City.findById(cityId);
      city = TranslationService.translate(city, language);
      const cityAirports = await Airport.find({ city: cityId });

      let cityAirportsObj = {};
      for (let airport of cityAirports) {
        if (airport.code in Object.keys(data['airports'])) {
          cityAirportsObj = {
            ...cityAirportsObj,
            [airport.code]: {
              location: data['airports'][airport.code].location,
              _id: data['airports'][airport.code]._id,
              name: data['airports'][airport.code].name,
              code: data['airports'][airport.code].code,
              timezone: data['airports'][airport.code].timezone,
              isActive: data['airports'][airport.code].isActive,
              __v: data['airports'][airport.code].__v
            }
          };
        } else {
          airport = TranslationService.translate(airport, language);
          cityAirportsObj = {
            ...cityAirportsObj,
            [airport.code]: {
              location: airport.location,
              _id: airport._id,
              name: airport.name,
              code: airport.code,
              timezone: airport.timezone,
              isActive: airport.isActive,
              __v: airport.__v
            }
          };
        }
      }

      return {
        city,
        airports: cityAirportsObj
      };
    } else {
      if (data['filterAirports'][citySecondSecType][legCode]) {
        return data['filterAirports'][citySecondSecType][legCode];
      } else {
        let city = await City.findOne({ code: legCode });
        const cityId = city._id;
        city = TranslationService.translate(city, language);
        const cityAirports = await Airport.find({ city: cityId });

        let cityAirportsObj = {};
        for (let airport of cityAirports) {
          if (airport.code in Object.keys(data['airports'])) {
            cityAirportsObj = {
              ...cityAirportsObj,
              [airport.code]: {
                location: data['airports'][airport.code].location,
                _id: data['airports'][airport.code]._id,
                name: data['airports'][airport.code].name,
                code: data['airports'][airport.code].code,
                timezone: data['airports'][airport.code].timezone,
                isActive: data['airports'][airport.code].isActive,
                __v: data['airports'][airport.code].__v
              }
            };
          } else {
            airport = TranslationService.translate(airport, language);
            cityAirportsObj = {
              ...cityAirportsObj,
              [airport.code]: {
                location: airport.location,
                _id: airport._id,
                name: airport.name,
                code: airport.code,
                timezone: airport.timezone,
                isActive: airport.isActive,
                __v: airport.__v
              }
            };
          }
        }

        return {
          city,
          airports: cityAirportsObj
        };
      }
    }
  }

  for (const leg of legs) {
    const departureCityData = await filterAiportsDataObj('arrival', leg.origin);

    const arrivalCityData = await filterAiportsDataObj(
      'departure',
      leg.destination
    );

    data['filterAirports']['departure'][leg.origin] = departureCityData;
    data['filterAirports']['arrival'][leg.destination] = arrivalCityData;
  }
  return data;
};

export const addAirlinesData = async (
  language: string,
  data: TransformedResult
) => {
  data = { ...data, airlines: {} };

  if (Object.keys(data.segments).length === 0) return data;

  const airlinesCodes = Object.values(data.segments).reduce((acc, segment) => {
    acc.push(segment.marketingCarrier, segment.operatingCarrier);
    return acc;
  }, [] as string[]);

  if (airlinesCodes.length === 0) return data;

  const airlines = await cache.getMultiKeys(
    airlinesCodes.map((code) => `airline-${code}`)
  );

  let foundAirlines = await Promise.all(
    airlines.map((airline, index) => {
      return airline !== null
        ? Promise.resolve(airline)
        : Airline.findOne({ code: airlinesCodes[index] });
    })
  );

  foundAirlines = TranslationService.interceptor(language, foundAirlines);

  for (let i = 0; i < airlinesCodes.length; i++) {
    data['airlines'][airlinesCodes[i]] =
      foundAirlines[i] && foundAirlines[i].code
        ? foundAirlines[i]
        : {
            code: airlinesCodes[i],
            name: airlinesCodes[i],
            translation: []
          };
  }

  return data;
};

export const addAircraftsData = async (
  language: string,
  data: TransformedResult
) => {
  data = { ...data, aircrafts: {} };

  if (Object.keys(data.segments).length === 0) return data;

  const aircraftsCodes = Object.values(data.segments).reduce((acc, segment) => {
    acc.push(segment.aircraft);
    return acc;
  }, [] as string[]);

  if (aircraftsCodes.length === 0) return data;

  const aircrafts = await cache.getMultiKeys(
    aircraftsCodes.map((code) => `aircraft-${code}`)
  );

  let foundAircrafts = await Promise.all(
    aircrafts.map((aircraft, index) => {
      return aircraft !== null
        ? Promise.resolve(aircraft)
        : Aircraft.findOne({ model: aircraftsCodes[index] });
    })
  );

  foundAircrafts = TranslationService.interceptor(language, foundAircrafts);

  for (let i = 0; i < aircraftsCodes.length; i++) {
    data['aircrafts'][aircraftsCodes[i]] =
      foundAircrafts[i] && foundAircrafts[i].model
        ? foundAircrafts[i]
        : {
            code: aircraftsCodes[i],
            name: aircraftsCodes[i],
            translation: []
          };
  }

  return data;
};

export const addHotelsData2 = async (
  language: string,
  transformedResult: TransformedHotelResult
) => {
  const newData = { ...transformedResult, hotels: {}, chains: {}, brands: {} };
  const hotelsCodes = [];

  if (!transformedResult.data) return transformedResult;

  for (const item of Object.values(transformedResult.data)) {
    hotelsCodes.push(item.hotelId);
  }

  const hotels = await Hotel.find({
    hotel_id: { $in: hotelsCodes },
    city_ref: { $exists: true }
  })
    .populate('chain')
    .populate('brand');

  // const chainsCodes = hotels.map((hotel) => {
  //   return hotel.chain.chain_id;
  // });
  const chainsCodes = hotels.map((hotel) => {
    return hotel.chain;
  });

  const brandsCodes = hotels.map((hotel) => {
    return hotel.brand.brand_id;
  });

  const hotelsData = hotels.reduce(
    (acc, current) => ({
      ...acc,
      [current.hotel_id]: current
    }),
    {}
  );

  const notFoundHotels = new Set();

  newData.hotels = hotelsCodes.reduce((acc, current) => {
    return {
      ...acc,
      [current]: hotelsData[current] || {
        hotel_id: current,
        name: 'Not Found',
        brand: {
          name: 'Not Found',
          brand_id: 'Not Found'
        },
        chain: {
          name: 'Not Found',
          chain_id: 'Not Found'
        },
        translation: []
      }
    };
  }, {});

  logger.info('not found hotels', [...notFoundHotels]);

  const chains = await Chain.find({
    chain_id: { $in: chainsCodes }
  });

  const chainsData = chains.reduce(
    (acc, current: any) => ({
      ...acc,
      [current.chain_id]: current
    }),
    {}
  );

  newData.chains = chainsCodes.reduce((acc, current) => {
    return {
      ...acc,
      [current]: chainsData[current] || {
        name: 'Not Found',
        code: current,
        translation: []
      }
    };
  }, {});

  const brands = await Brand.find({
    brand_id: { $in: brandsCodes }
  });

  const brandsData = brands.reduce(
    (acc, current: any) => ({
      ...acc,
      [current.brand_id]: current
    }),
    {}
  );

  newData.brands = brandsCodes.reduce((acc, current) => {
    return {
      ...acc,
      [current]: brandsData[current] || {
        name: 'Not Found',
        code: current,
        translation: []
      }
    };
  }, {});

  return newData;
};
export const addHotelsData = async (
  language: string,
  providerName: string,
  hotels: any[]
) => {
  hotels = TranslationService.interceptor(language, hotels);
  const hotelsData = hotels.reduce(
    (acc, current) => ({
      ...acc,
      [current.giataId]: current
    }),
    {}
  );
  const dumpHotels = hotels.reduce((acc, current) => {
    return {
      ...acc,
      [current.providerCodes[`${providerName}`][0]]: current
    };
  }, {});

  return {
    hotelsData,
    dumpHotels
  };
};

export const addStationsData = async (
  language: string,
  providerName: string,
  data: any[]
) => {
  const providerMapping = {
    kiwi: 'kiwi_code',
    distribusion: 'distribusion_code',
    saveatrain: 'saveatrain_code',
    combigo: 'combigo_code',
    omio: 'omio_code',
    kombo: 'kombo_code'
  };

  const providerCode = providerMapping[providerName];
  let stationsCodes = data.reduce((acc, segment) => {
    acc.push(segment.origin, segment.destination);
    return acc;
  }, [] as string[]);

  stationsCodes = stationsCodes.filter(
    (c: any) => c.length > 0 || c !== undefined || c !== null
  );

  let docs = await Station.find({
    [providerCode]: { $in: stationsCodes }
  });
  docs = TranslationService.interceptor(language, docs);

  const stationsData = docs.reduce(
    (acc, current) => ({
      ...acc,
      [current[providerCode]]: current
    }),
    {}
  );
  const stations = {};
  const dumpStations = {};
  for (let i = 0; i < data.length; i++) {
    const origin = stationsData[data[i].origin]
      ? stationsData[data[i].origin]
      : {
          name: data[i].origin,
          code: data[i].origin,
          location:
            data[i].fromLat && data[i].fromLng
              ? {
                  type: 'Point',
                  coordinates: [data[i].fromLng, data[i].fromLat]
                }
              : undefined,
          timezone: data[i].fromTimezone
            ? data[i].fromTimezone
            : 'Europe/Madrid'
        };
    origin[`${providerName}_code`] = data[i].origin;

    const destination = stationsData[data[i].destination]
      ? stationsData[data[i].destination]
      : {
          name: data[i].destination,
          code: data[i].destination,
          location:
            data[i].toLat && data[i].toLng
              ? {
                  type: 'Point',
                  coordinates: [data[i].toLng, data[i].toLat]
                }
              : undefined,
          timezone: data[i].toTimezone ? data[i].toTimezone : 'Europe/Madrid'
        };
    destination[`${providerName}_code`] = data[i].destination;

    stations[origin.code] = origin;
    stations[destination.code] = destination;
    dumpStations[origin[`${providerName}_code`]] = origin.code;
    dumpStations[destination[`${providerName}_code`]] = destination.code;
  }
  return {
    stations,
    dumpStations
  };
};

export const addCarriersData = async (
  language: string,
  providerName: string,
  data: any[]
) => {
  const providerMapping = {
    kiwi: 'kiwi_code',
    distribusion: 'distribusion_code',
    saveatrain: 'saveatrain_code',
    combige: 'combigo_code',
    omio: 'omio_code',
    kombo: 'kombo_code'
  };

  const providerCode = providerMapping[providerName];

  let carriersCodes = data.reduce((acc, segment) => {
    acc.push(segment.marketingCarrier, segment.operatingCarrier);
    return acc;
  }, [] as string[]);

  carriersCodes = carriersCodes.filter(
    (c: any) => c.length > 0 && c !== undefined && c !== null
  );
  carriersCodes = [...new Set(carriersCodes)];

  let docs = await Carrier.find({
    [providerCode]: { $in: carriersCodes }
  });

  docs = TranslationService.interceptor(language, docs);

  const carriersData = docs.reduce(
    (acc, current) => ({
      ...acc,
      [current[providerCode]]: current
    }),
    {}
  );

  const carriers = {};
  const dumpCarriers = {};

  for (let i = 0; i < data.length; i++) {
    if ((data[i].marketingCarrier === '', data[i].operatingCarrier === ''))
      continue;
    const marketingCarrier = carriersData[data[i].marketingCarrier]
      ? carriersData[data[i].marketingCarrier]
      : {
          name: data[i].marketingCarrier,
          code: data[i].marketingCarrier
        };

    const operatingCarrier = carriersData[data[i].operatingCarrier]
      ? carriersData[data[i].operatingCarrier]
      : {
          name: data[i].operatingCarrier,
          code: data[i].operatingCarrier
        };

    carriers[marketingCarrier.code] = marketingCarrier;
    carriers[operatingCarrier.code] = operatingCarrier;
    dumpCarriers[
      marketingCarrier[`${providerName}_code`]
        ? marketingCarrier[`${providerName}_code`]
        : marketingCarrier.code
    ] = marketingCarrier.code;
    dumpCarriers[
      operatingCarrier[`${providerName}_code`]
        ? operatingCarrier[`${providerName}_code`]
        : operatingCarrier.code
    ] = operatingCarrier.code;
  }

  return {
    carriers,
    dumpCarriers
  };
};

export const calculateDurations = (data: TransformedResult) => {
  if (!data.segments) return data;
  const newData = { ...data };

  for (const segment of Object.values(data.segments)) {
    const duration = calculateDuration(
      data.airports[segment.origin],
      data.airports[segment.destination],
      segment.departure,
      segment.arrival
    );

    newData.segments[segment.id] = {
      ...segment,
      duration
    };
  }
  for (const leg of Object.values(data.legs)) {
    const duration = calculateDuration(
      data.airports[leg.origin],
      data.airports[leg.destination],
      leg.departure,
      leg.arrival
    );
    newData.legs[leg.id] = {
      ...leg,
      duration
    };
  }

  return newData;
};

export const calculateStationDurations = async (
  data: TransformedTrainResult
) => {
  if (!data.segments) return data;
  for (const segment of Object.values(data.segments)) {
    const duration = calculateDuration(
      data.stations[segment.origin],
      data.stations[segment.destination],
      segment.departure,
      segment.arrival
    );

    data.segments[segment.id] = {
      ...segment,
      duration
    };
  }
  for (const leg of Object.values(data.legs)) {
    const duration = calculateDuration(
      data.stations[leg.origin],
      data.stations[leg.destination],
      leg.departure,
      leg.arrival
    );
    data.legs[leg.id] = {
      ...leg,
      duration
    };
  }

  return data;
};
