import axios from 'axios';
import logger from '../../../../configs/logger'; 
import queryString from 'query-string';
import xml2js from 'xml2js';

const parser = new xml2js.Parser();

const { FAREHUTS_API_URL, FAREHUTS_PARTNER, FAREHUTS_PASSWORD } = process.env;

const cabinClassMap = {
  Economy: 'Y',
  Business: 'C',
  First: 'F'
};

const POS = ['US', 'CA', 'GB', 'IN'];
const supportedCurrencies = ['USD', 'GBP', 'CAD'];

const transformOptions = (options: SearchOptions) => {
  const {
    adults,
    children,
    infants,
    cabinClass,
    country,
    currency,
    language,
    tripType,
    legs
  } = options;
  return {
    adults,
    children,
    infants,
    cabin: cabinClassMap[cabinClass],
    country,
    currency,
    language,
    tripType,
    legs
  };
};

const search = async (input: SearchOptions) => {
  if (
    input.tripType === 'multi' ||
    !POS.includes(input.country) ||
    input.cabinClass === 'Premium_Economy'
  )
    return {};
  const options = transformOptions(input);
  const payload = {
    from: options.legs[0].origin,
    to: options.legs[0].destination,
    date1: options.legs[0].departure,
    date2: options.tripType === 'round' ? options.legs[1].departure : undefined,
    adults: options.adults,
    children: options.children,
    infants: options.infants,
    currency: supportedCurrencies.includes(options.currency)
      ? options.currency
      : 'USD',
    cabin: options.cabin,
    locale: options.language,
    partner: FAREHUTS_PARTNER,
    password: FAREHUTS_PASSWORD,
    market: options.country
  };

  // send axios request
  const results = await axios
    .get(`${FAREHUTS_API_URL}?${queryString.stringify(payload)}`)
    .then((response) => response.data)
    .then((xmlResponse) => parser.parseStringPromise(xmlResponse))
    .catch((error) => {
      logger.error(error);
      return {};
    });

  // return results
  return results;
};
export default search;
