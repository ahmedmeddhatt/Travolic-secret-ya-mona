import axios from 'axios';
import logger from '../../../../configs/logger';
import { supportedCountries, supportedCurrencies } from './POS';
const { FRIENDZTRAVEL_URL, FRIENDZTRAVEL_PASSWORD } = process.env;

const cabinClassMap: IDictionary<string> = {
  Economy: 'Y',
  Business: 'C',
  First: 'F'
};

const formLegs = (legs: SearchOptionLeg[]) => {
  const legsData = [];
  for (const leg of legs) {
    const Data = {
      origin: leg.origin,
      destination: leg.destination,
      departure: leg.departure
    };
    legsData.push(Data);
  }
  return legsData;
};

const transformOptions = (input: SearchOptions) => {
  const { country, currency, adults, children, infants, cabinClass, legs } =
    input;
  return {
    country,
    currency: supportedCurrencies.includes(currency) ? currency : 'USD',
    adults,
    children,
    infants,
    cabinClass: cabinClassMap[cabinClass],
    legs
  };
};

const search = function async(input: SearchOptions) {
  if (
    input.tripType === 'multi' ||
    !supportedCountries.includes(input.country) ||
    input.cabinClass === 'Premium_Economy'
  )
    return [{}];
  const options = transformOptions(input);
  const legs = formLegs(options.legs);
  const partner = 'travolic';
  const locate = 'en';
  const market = input.country === 'GB' ? 'UK' : input.country;
  let URL = `${FRIENDZTRAVEL_URL}?from=${options.legs[0].origin}&to=${legs[0].destination}&date1=${legs[0].departure}&adults=${options.adults}&children=${options.children}&infants=${options.infants}&partner=${partner}&password=${FRIENDZTRAVEL_PASSWORD}&locate=${locate}&currency=${options.currency}&cabin=${options.cabinClass}&market=${market}`;
  if (input.tripType === 'round')
    URL = URL.concat(`&date2=${legs[1].departure}`);
  const Data = axios
    .get(URL)
    .then((res) => res.data)
    .catch((error) => {
      logger.error(error);
      return {};
    });
  return Data;
};

export default search;
