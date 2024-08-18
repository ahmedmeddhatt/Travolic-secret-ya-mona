import axios from 'axios';
import logger from '../../../../configs/logger';
import querystring from 'query-string';

const { BDF_API_URL, BDF_utmsource, BDF_pwd, BDF_siteID } = process.env;

const cabinClassMap = {
  Economy: '1',
  Premium_Economy: '2',
  Business: '3',
  First: '4'
};

const Supported_curriencies = ['USD'];
const POS = ['US'];

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
    !Supported_curriencies.includes(input.currency) ||
    !POS.includes(input.country)
  )
    return {};
  const options = transformOptions(input);
  const payload = {
    seg1: `${options.legs[0].origin}|${options.legs[0].destination}|${options.legs[0].departure}`,
    seg2:
      options.tripType === 'round'
        ? `${options.legs[1].origin}|${options.legs[1].destination}|${options.legs[1].departure}`
        : undefined,
    adults: options.adults,
    child: options.children,
    infants: options.infants,
    currency: options.currency,
    cabin: options.cabin,
    airline: 'all',
    siteID: BDF_siteID,
    pwd: BDF_pwd,
    utmsource: BDF_utmsource
  };

  const results = await axios
    .get(`${BDF_API_URL}?${querystring.stringify(payload)}`)
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err.message);
      return {};
    });
  return results;
};
export default search;
