import axios from 'axios';
import querystring from 'querystring';
import logger from '../../../../configs/logger';
import { supportedCountries } from './POS';

const { FLYODEALS_PASSWORD, FLYODEALS_URL } = process.env;
const locale = 'en',
  partner = 'travolic';

const cabinClassMap: IDictionary<string> = {
  Economy: 'Y',
  First: 'F',
  Business: 'C'
};

const transformInput = (input: SearchOptions) => {
  const { adults, children, infants, cabinClass, country } = input;
  return {
    adults,
    children,
    infants,
    cabinClass: cabinClassMap[cabinClass],
    country,
    currency: 'USD'
  };
};

const transformLeg = (legs: SearchOptionLeg[]) => {
  const transformedLegs = [];
  for (const leg of legs) {
    const data = {
      From: leg.origin,
      To: leg.destination,
      Dept_Date: leg.departure
    };
    transformedLegs.push(data);
  }
  return transformedLegs;
};

const search = async (input: SearchOptions) => {
  if (
    input.tripType === 'multi' ||
    input.cabinClass === 'Premium_Economy' ||
    !supportedCountries.includes(input.country)
  )
    return {};
  const options = transformInput(input);
  const transformedLegs = transformLeg(input.legs);
  const payload = {
    from: transformedLegs[0].From,
    to: transformedLegs[0].To,
    date1: transformedLegs[0].Dept_Date,
    adults: options.adults,
    children: options.children,
    infants: options.infants,
    cabin: options.cabinClass,
    locale,
    currency: options.currency,
    partner,
    password: FLYODEALS_PASSWORD
  };
  if (input.tripType === 'round')
    payload['date2'] = transformedLegs[1].Dept_Date;
  const results = axios
    .get(`${FLYODEALS_URL}?${querystring.stringify(payload)}`)
    .then((data) => data.data)
    .catch((err) => logger.error(err));
  return results;
};

export default search;
