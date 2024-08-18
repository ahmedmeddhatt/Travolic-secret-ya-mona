import xml2js from 'xml2js';
import axios from 'axios';
import moment from 'moment';
import queryString from 'querystring';
import qs from 'qs';
import logger from '../../../../configs/logger';

const { KISSANDFLY_SEARCH_API_URL, KISSANDFLY_API_KEY } = process.env;

const parser = new xml2js.Parser();

const tripClassMap: IDictionary<string> = {
  Economy: 'E',
  Premium_Economy: 'A',
  Business: 'B',
  First: 'B'
};

const transformOpions = (options: SearchOptions) => {
  const { currency, country, adults, children, infants, cabinClass } = options;

  return {
    currency,
    country,
    adults,
    children,
    infants,
    cabinClass: tripClassMap[cabinClass]
  };
};

const convertLegs = (legs: SearchOptionLeg[]): SearchOptionLeg[] => {
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

  if (options.country !== 'US') {
    return {};
  }

  const flightLegs = qs.stringify({ destinations: convertLegs(input.legs) });
  const payload = {
    key: KISSANDFLY_API_KEY,
    action: 'search',
    driver: 'kf_xml_com',
    currency: options.currency,
    adt: options.adults,
    chd: options.children,
    inf: options.infants,
    service_class: options.cabinClass,
    subch: 'web'
  };

  const data = await axios
    .get(
      `${KISSANDFLY_SEARCH_API_URL}?${queryString.stringify(
        payload
      )}&${flightLegs}`
    )
    .then((res) => res.data)
    .then((res) => parser.parseStringPromise(res))
    .catch((err) => {
      logger.error(err);
      return {};
    });

  return data;
};

export default search;
