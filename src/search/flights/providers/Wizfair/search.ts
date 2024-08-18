import axios from 'axios';
import logger from '../../../../configs/logger';
import querystring from 'query-string';

const { WIZFAIR_URL, WIZFAIR_COMPID } = process.env;
const cabinClassMap = {
  Economy: 'Y',
  Business: 'C',
  First: 'F'
};
const Supported_curriencies = ['USD', 'GBP', 'CAD', 'INR', 'AED', 'AUD', 'SAR'];

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
    input.cabinClass === 'Premium_Economy'
  )
    return {};
  const options = transformOptions(input);
  const payload = {
    From: options.legs[0].origin,
    To: options.legs[0].destination,
    date1: options.legs[0].departure,
    date2: options.tripType === 'round' ? options.legs[1].departure : undefined,
    Adults: options.adults,
    Children: options.children,
    Infants: options.infants,
    Currency: options.currency,
    Cabin: options.cabin,
    Locale: options.language,
    CompId: WIZFAIR_COMPID
  };

  const result = await axios
    .get(`${WIZFAIR_URL}?${querystring.stringify(payload)}`)
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err.message);
      return {};
    });
  return result;
};
export default search;
