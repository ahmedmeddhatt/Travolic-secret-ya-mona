import axios from 'axios';
import xml2js from 'xml2js';
import moment from 'moment';
import queryString from 'qs';
import logger from '../../../../configs/logger';

const { MYTICKETS_SEARCH_API_URL, MYTICKETS_API_KEY } = process.env;

const parser = new xml2js.Parser();

const tripClassMap = {
  Economy: 'E',
  Premium_Economy: 'A',
  Business: 'B'
};

const transformOpions = (options: SearchOptions) => {
  const { currency, country, adults, children, infants, cabinClass } = options;
  if (options.cabinClass == 'First') return {};
  return {
    currency,
    country,
    adults,
    children,
    infants,
    cabinClass: tripClassMap[cabinClass]
  };
};

const ConvertLegs = (legs: SearchOptionLeg[]) => {
  const flightLegs = [];

  for (const leg of legs) {
    flightLegs.push({
      departure: leg.origin,
      arrival: leg.destination,
      date: moment.utc(leg.departure).format('DD-MM-YYYY')
    });
  }

  return flightLegs;
};

const search = async (input: SearchOptions) => {
  const options = transformOpions(input);

  if (options.country !== 'AE') {
    return {};
  }

  const flightLegs = queryString.stringify({
    destinations: ConvertLegs(input.legs)
  });

  const payload = {
    key: MYTICKETS_API_KEY,
    action: 'search',
    driver: 'xml_ae',
    currency: options.currency,
    adt: options.adults,
    chd: options.children,
    inf: options.infants,
    service_class: options.cabinClass,
    subch: 'web'
  };

  const results = await axios
    .get(
      `${MYTICKETS_SEARCH_API_URL}?${queryString.stringify(
        payload
      )}&${flightLegs}`
    )
    .then((response) => response.data)
    .then((xmlResponse) => parser.parseStringPromise(xmlResponse))
    .catch((error) => {
      logger.error(error);
      return {};
    });

  return results;
};

export default search;
