import axios from 'axios';
import logger from '../../../../configs/logger';
import {
  routesAirport_Airport,
  routesAirport_City,
  routesCity_Airport,
  routesCity_City
} from './routes';

const { VOLARIO_API_KEY, VOLARIO_API_URL } = process.env;
const cabinClassMap = {
  Economy: 'ECONOMY',
  Business: 'BUSINESS',
  First: 'FIRST',
  Premium_Economy: 'ECONOMY_PREMIUM'
};

const languageMap: IDictionary<string> = {
  fr: 'fr_fr',
  de: 'de_de',
  it: 'it_it',
  es: 'es_es',
  en: 'en_en'
};

const transformOptions = (options: SearchOptions) => {
  const {
    tripType,
    currency,
    country,
    language,
    legs,
    adults,
    children,
    infants,
    cabinClass
  } = options;

  return {
    tripType,
    currency,
    country,
    language: languageMap[language] ? languageMap[language] : languageMap['en'],
    legs,
    adults,
    children,
    infants,
    cabinClass: cabinClassMap[cabinClass]
  };
};

const search = async (input: SearchOptions) => {
  const options = transformOptions(input);

  if (options.tripType == 'multi') return {};

  const payload = {
    origin_airport_iata: undefined,
    destination_airport_iata: undefined,

    origin_city_iata: undefined,
    destination_city_iata: undefined,

    flight_date: options.legs[0].departure,
    num_adult_passenger: options.adults,
    num_children_passenger: options.children,
    num_infant_passenger: options.infants,
    return_date:
      options.tripType === 'round' ? options.legs[1].departure : undefined,
    cabin_class: options.cabinClass
  };

  if (options.legs[0].orig_city && options.legs[0].dest_city) {
    const allowRoutes = routesCity_City.find(
      (item) =>
        item.origin == options.legs[0].origin &&
        item.destination == options.legs[0].destination
    );
    if (!allowRoutes) {
      return {};
    }

    (payload.origin_city_iata = options.legs[0].origin),
      (payload.destination_city_iata = options.legs[0].destination);
  } else if (options.legs[0].orig_city && !options.legs[0].dest_city) {
    const allowRoutes = routesCity_Airport.find(
      (item) =>
        item.origin == options.legs[0].origin &&
        item.destination == options.legs[0].destination
    );
    if (!allowRoutes) {
      return {};
    }

    (payload.origin_city_iata = options.legs[0].origin),
      (payload.destination_airport_iata = options.legs[0].destination);
  } else if (!options.legs[0].orig_city && options.legs[0].dest_city) {
    const allowRoutes = routesAirport_City.find(
      (item) =>
        item.origin == options.legs[0].origin &&
        item.destination == options.legs[0].destination
    );
    if (!allowRoutes) {
      return {};
    }

    (payload.origin_airport_iata = options.legs[0].origin),
      (payload.destination_city_iata = options.legs[0].destination);
  } else {
    const allowRoutes = routesAirport_Airport.find(
      (item) =>
        item.origin == options.legs[0].origin &&
        item.destination == options.legs[0].destination
    );
    if (!allowRoutes) {
      return {};
    }
    (payload.origin_airport_iata = options.legs[0].origin),
      (payload.destination_airport_iata = options.legs[0].destination);
  }

  const data = await axios
    .post(
      `${VOLARIO_API_URL}?sync=true&locale=${options.language}&sort=cheapest`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          'x-api-key': VOLARIO_API_KEY
        }
      }
    )
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      logger.error(err);
      return {};
    });

  return data;
};

export default search;
