import axios from 'axios';
import logger from '../../../../configs/logger';
import POS from './pos';

const { TRAFFICSOURCE } = process.env;

const cabinClassMap = {
  Economy: 'economy',
  Premium_Economy: 'premium_economy',
  Business: 'business',
  First: 'first'
};

const formatLegs = (legs) => {
  const convertedLegs = [];
  legs.forEach((leg) => {
    convertedLegs.push({
      departureCode: leg.origin,
      arrivalCode: leg.destination,
      outboundDate: leg.departure
    });
  });
  return convertedLegs;
};

const transformOptions = (options: SearchOptions) => {
  const {
    currency,
    country,
    language,
    legs,
    adults,
    children,
    infants,
    cabinClass,
    userData,
    tripType
  } = options;
  return {
    currency,
    country,
    language,
    legs: formatLegs(legs),
    adultsCount: adults,
    childrenCount: children,
    infantsCount: infants,
    cabin: cabinClassMap[cabinClass],
    userData,
    tripType
  };
};

const search = async (input: SearchOptions) => {
  const options = transformOptions(input);
  if (options.tripType === 'multi') return {};
  const partnerData = POS.find((p) => p.country === options.country);

  if (!partnerData) {
    return {};
  }

  const payload = {
    legs: options.legs,
    adultsCount: options.adultsCount,
    childrenCount: options.childrenCount,
    infantwsCount: 0,
    infantsCount: options.infantsCount,
    cabin: options.cabin,
    device: 'desktop',
    trafficSource: TRAFFICSOURCE,
    userIp: options.userData.ip,
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/5 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'
  };

  const requestURL = 'https://metaapi.cheapflightsfares.com/metaflights/search';
  const data = await axios
    .post(requestURL, payload, {
      method: 'post',
      headers: {
        'Content-type': 'application/json',
        'Accept-Encoding': 'gzip'
      }
    })
    .then((res) => res.data)
    .catch((error) => {
      logger.error(error);
      throw new Error('Failed to search for flights');
    });

  return data;
};
export default search;
