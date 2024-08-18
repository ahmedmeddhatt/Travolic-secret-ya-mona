import axios from 'axios';
import moment from 'moment';
import {
  supportedCountries,
  supportedCurrencies,
  supportedLanguages
} from './pos';
import logger from '../../../../configs/logger';

const { FLYNFARE_URL, FLYNFARE_SECRET_KEY } = process.env;
const cabinClassMap = {
  Economy: 'Economy',
  Premium_Economy: 'PremiumEconomy',
  Business: 'Business',
  First: 'FirstClass'
};

const TripTypeMap = {
  round: 'Roundtrip',
  oneway: 'oneway'
};

const transformOptions = (options: SearchOptions) => {
  const { cabinClass, tripType } = options;
  return {
    cabin: cabinClassMap[cabinClass],
    tripType: TripTypeMap[tripType]
  };
};

const convertDate = (inputDate) => {
  return moment.utc(inputDate, 'YYYY-MM-DD').format('DD-MM-YYYY');
};

const search = async (input: SearchOptions) => {
  if (
    input.tripType === 'multi' ||
    !supportedCountries.includes(input.country) ||
    !supportedCurrencies.includes(input.currency) ||
    !supportedLanguages.includes(input.language)
  ) {
    return {};
  }
  const options = transformOptions(input);
  const departDate = convertDate(input.legs[0].departure);

  let URL = `${FLYNFARE_URL}?origin=${input.legs[0].origin}&destination=${input.legs[0].destination}&departuredate=${departDate}&adults=${input.adults}&children=${input.children}&infants=${input.infants}&cabinClass=${options.cabin}&tripType=${options.tripType}&secretKey=${FLYNFARE_SECRET_KEY}`;

  if (input.tripType === 'round') {
    const returnDate = convertDate(input.legs[1].departure);
    URL = URL.concat(`&returndate=${returnDate}`);
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
