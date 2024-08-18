import axios from 'axios';
import logger from '../../../../configs/logger';
import { domains } from './POS';
const cabinClassMap: IDictionary<string> = {
  Economy: 'ECO',
  Premium_Economy: 'FLX',
  Business: 'BIZ',
  First: 'FST'
};

const transformOptions = (options: SearchOptions) => {
  const {
    tripType,
    legs,
    currency,
    adults,
    children,
    infants,
    cabinClass,
    country
  } = options;
  return {
    tripType,
    legs,
    currency,
    adults,
    children,
    infants,
    cabinClass: cabinClassMap[cabinClass],
    country
  };
};
const search = async (input: SearchOptions) => {
  if (
    input.tripType == 'multi' ||
    !Object.keys(domains).includes(input.country)
  )
    return {};
  const options = transformOptions(input);
  const payload = {
    origin: options.legs[0].origin,
    destination: options.legs[0].destination,
    depDate: options.legs[0].departure,
    Class: options.cabinClass,
    adults: options.adults,
    children: options.children,
    Infants: options.infants
  };
  if (options.tripType === 'round') {
    payload['retDate'] = options.legs[1].departure;
  }
  const queryString = Object.keys(payload)
    .map((key) => `${key}=${encodeURIComponent(payload[key])}`)
    .join('&');
  const { url } = domains[options.country];

  const data = await axios
    .get(`${url}${queryString}`)
    .then((response) => {
      return response.data;
    })
    .then((jsonData) => {
      jsonData = jsonData.replace(
        `<GetSearchAirFareResponseResponse xmlns="http://tempuri.org/"><GetSearchAirFareResponseResult>`,
        ''
      );
      jsonData = jsonData.replace(
        `</GetSearchAirFareResponseResult></GetSearchAirFareResponseResponse>`,
        ''
      );

      return JSON.parse(jsonData);
    })
    .catch((err) => {
      logger.error(err);
      return {};
    });
  return data;
};
export default search;
