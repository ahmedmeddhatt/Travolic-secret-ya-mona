import moment from 'moment';
import axios from 'axios';
import querystring from 'querystring';

const { AMADEUS_AFFILIATE_API_KEY, AMADEUS_SEARCH_API_URL } = process.env;

const cabinClassMap: IDictionary<string> = {
  Economy: 'ECONOMY',
  Premium_Economy: 'PREMIUM_ECONOMY',
  First: 'FIRST',
  Business: 'BUSINESS'
};

const transformOpions = (options: SearchOptions) => {
  const { legs, currency, adults, children, infants, cabinClass, tripType } =
    options;
  return {
    legs,
    currency,
    adults,
    children,
    infants,
    cabinClass,
    tripType
  };
};

const formLegs = (legs: SearchOptionLeg[]) => {
  const legsData = {
    origins: [],
    destinations: [],
    dates: []
  };

  for (const leg of legs) {
    legsData.origins.push(leg.origin);
    legsData.destinations.push(leg.destination);
    legsData.dates.push(moment.utc(leg.departure).format('YYYY-MM-DD'));
  }

  return {
    origins: legsData.origins.join(','),
    destinations: legsData.destinations.join(','),
    dates: legsData.dates.join(',')
  };
};

const search = async (input: SearchOptions) => {
  const options = transformOpions(input);
  if (options.tripType === 'multi') return {};
  const formedLegs = formLegs(input.legs);
  const basePayload = {
    affiliate_key: AMADEUS_AFFILIATE_API_KEY,
    locale: `${input.language}-${input.country}`,
    platform: 'web',
    preferred_landing_page: 'calendar',
    flow: 'NETWORK',
    number_of_results: 1000
  };
  const payload = {
    ...basePayload,
    ...formedLegs,
    currency: options.currency,
    adults: options.adults,
    children: options.children,
    infants: options.infants,
    travel_class: cabinClassMap[options.cabinClass]
  };
  const { data } = await axios.get(
    `${AMADEUS_SEARCH_API_URL}?${querystring.stringify(payload)}`
  );

  return data;
};

export default search;
