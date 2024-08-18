import axios from "axios";
import logger from '../../../../configs/logger';
import queryString from 'query-string';
import {parseStringPromise} from 'xml2js';
import { defaultCurrency } from "../TheBarGainTripCopy/pos";


// environment variables
const { FAREHUTS_API_URL, FAREHUTS_PARTNER, FAREHUTS_PASSWORD } = process.env;


const cabinClassMap = {
  Economy: 'Y',
  Business: 'C',
  First: 'F'
};

// supported points of sale (countries)
const POS = ['US', 'CA', 'GB', 'IN'];

// supported currencies
const supportedCurrencies = ['USD', 'GBP', 'CAD'];

// Function to transform search options into a format suitable for the API
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
  // check if there is data after filteration with POS
  if (
    input.tripType === 'multi' || // multi-city trips are not supported
    input.cabinClass === 'Premium_Economy' || // premium Economy is not supported
    !POS.includes(input.country) // check if the country is supported
  ) {
    logger.error('No flights found!')
    return {};
  };

    // Transform the input data to match the provider's schema
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
    : defaultCurrency,
    cabin: options.cabin,
    locale: options.language,
    partner: FAREHUTS_PARTNER,
    password: FAREHUTS_PASSWORD,
    market: options.country
    };

    const URL = `${FAREHUTS_API_URL}?${queryString.stringify(payload)}`;
    console.log('URL', URL);
    

    try {
      // Send a request to the provider
      const res = await axios.get(URL);

      return parseStringPromise(res.data);
  } catch (err) {
      logger.error(err.message);
      return {};
  }



};


export default search;
