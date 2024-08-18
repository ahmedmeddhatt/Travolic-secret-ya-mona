import axios from 'axios';
import moment from 'moment';
import {
  supportedCountries,
  supportedCurrencies,
  supportedLanguages
} from './pos';
import logger from '../../../../configs/logger';

const { LOOKUPVACATIONS_TOKEN, LOOKUPVACATIONS_URL } = process.env;
const cabinClassMap = {
  Economy: 'Y',
  Premium_Economy: 'S',
  Business: 'B',
  First: 'F'
};

const TripTypeMap = {
  round: 'roundtrip',
  oneway: 'oneway'
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
    !supportedLanguages.includes(input.language) ||
    !supportedCountries.includes(input.country)
  ) {
    return {};
  }
  const options = transformOptions(input);

  let domainCountry;
  if (input.country === 'AE') {
    domainCountry = 'ae.';
  } else if (input.country === 'GB') {
    domainCountry = 'uk.';
  } else {
    domainCountry = '';
  }

  const departDate = moment
      .utc(options.legs[0].departure, 'YYYY-MM-DD')
      .format('DD-MMM-YYYY'),
    meta_name = 'travolic';

  let URL = `https://${domainCountry}${LOOKUPVACATIONS_URL}?tripType=${options.tripType}&origin1=${options.legs[0].origin}&destination1=${options.legs[0].destination}&departDate1=${departDate}&adults=${options.adults}&childs=${options.children}&infants=${options.infants}&classType=${options.cabin}&currency=${options.currency}&metaName=${meta_name}`;

  if (input.tripType === 'round') {
    const returnDate = moment
      .utc(options.legs[1].departure, 'YYYY-MM-DD')
      .format('DD-MMM-YYYY');
    URL = URL.concat(`&returnDate1=${returnDate}`);
  }

  const result = await axios
    .get(URL, {
      headers: {
        key: LOOKUPVACATIONS_TOKEN
      }
    })
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err.message);
      return {};
    });
  return result;
};
export default search;
