import axios from 'axios';
import { supportedCurrencies, supportedLanguages } from './pos';
import logger from '../../../../configs/logger';
import querystring from 'query-string';

const { TRAVELO1_URL, TRAVELO1_META_ID, TRAVELO1_META_NAME } = process.env;
const cabinClassMap = {
  Economy: 'Y',
  Premium_Economy: 'S',
  Business: 'C',
  First: 'F'
};

const TripTypeMap = {
  round: '1',
  oneway: '0'
};

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
    tripType: TripTypeMap[tripType],
    legs
  };
};

const search = async (input: SearchOptions) => {
  if (
    input.tripType === 'multi' ||
    !supportedCurrencies.includes(input.currency) ||
    !supportedLanguages.includes(input.language)
  ) {
    return {};
  }
  const options = transformOptions(input);
  let fullURL;
  if (input.tripType === 'oneway') {
    fullURL = `${TRAVELO1_URL}?fromcity[]=${options.legs[0].origin}&tocity[]=${options.legs[0].destination}&depart[]=${options.legs[0].departure}&adult=${options.adults}&child=${options.children}&infant=${options.infants}&classtype=${options.cabin}&locale=${options.language}&triptype=${options.tripType}&meta_id=${TRAVELO1_META_ID}&meta_name=${TRAVELO1_META_NAME}`;
  } else {
    fullURL = `${TRAVELO1_URL}?fromcity[]=${options.legs[0].origin}&tocity[]=${options.legs[0].destination}&depart[]=${options.legs[0].departure}&return[]=${options.legs[1].departure}&adult=${options.adults}&child=${options.children}&infant=${options.infants}&classtype=${options.cabin}&locale=${options.language}&triptype=${options.tripType}&meta_id=${TRAVELO1_META_ID}&meta_name=${TRAVELO1_META_NAME}`;
  }
  querystring.stringify(fullURL);
  const result = await axios
    .get(fullURL)
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err.message);
      return {};
    });
  return result;
};
export default search;
