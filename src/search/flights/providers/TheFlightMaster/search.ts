import axios from 'axios';
import moment from 'moment';
import {
  supportedCountries,
  supportedCurrencies,
  supportedLanguages
} from './pos';
import logger from '../../../../configs/logger';

const { THEFLIGHTMASTER_URL, THEFLIGHTMASTER_PASSWORD } = process.env;
const cabinClassMap = {
  Economy: 'Economy',
  Premium_Economy: 'PremiumEconomy',
  Business: 'Business',
  First: 'First'
};

const TripTypeMap = {
  round: 'roundtrip',
  oneway: 'oneway'
};

const transformOptions = (options: SearchOptions) => {
  const { cabinClass, tripType } = options;
  return {
    cabin: cabinClassMap[cabinClass],
    tripType: TripTypeMap[tripType]
  };
};

const transformDate = (tripDate) => {
  return moment.utc(tripDate, 'YYYY-MM-DD').format('MMM-DD-YYYY');
};

const search = async (input: SearchOptions) => {
  if (
    input.tripType === 'multi' ||
    !supportedCurrencies.includes(input.currency) ||
    !supportedLanguages.includes(input.language) ||
    !supportedCountries.includes(input.country)
  ) {
    return {};
  }
  const options = transformOptions(input);

  const departDate = transformDate(input.legs[0].departure),
    infonCode = 'F',
    userid = 'admin',
    website = 'theflightmaster',
    metaId = 2024;

  let URL = `${THEFLIGHTMASTER_URL}?JType=${options.tripType}&org=${input.legs[0].origin}&dest=${input.legs[0].destination}&depDt=${departDate}&adt=${input.adults}&chd=${input.children}&inf=${input.infants}&ct=${options.cabin}&infon=${infonCode}&password=${THEFLIGHTMASTER_PASSWORD}&userid=${userid}&website=${website}&metaId=${metaId}`;

  if (input.tripType === 'round') {
    const returnDate = transformDate(input.legs[1].departure);
    URL = URL.concat(`&retDt=${returnDate}`);
  }

  const result = await axios
    .get(URL)
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err.message);
      return {};
    });
  return result;
};
export default search;
