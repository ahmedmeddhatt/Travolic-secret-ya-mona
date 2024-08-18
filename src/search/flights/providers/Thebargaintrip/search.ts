import axios from 'axios';
import { supportedCurrencies, deafultCurrency } from './pos';
import logger from '../../../../configs/logger';
const { THEBARGAINTRIP_TOKEN, THEBARGAINTRIP_URL } = process.env;

const cabinClassMap = {
  Economy: '1',
  Premium_Economy: '2',
  Business: '4',
  First: '6'
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
    currency: supportedCurrencies.includes(currency)
      ? currency
      : deafultCurrency,
    language,
    tripType: TripTypeMap[tripType],
    legs
  };
};

const search = async (input: SearchOptions) => {
  if (input.tripType === 'multi') {
    return {};
  }
  const options = transformOptions(input),
    source = 'TRAVOLIC ',
    siteid = '105',
    sec1Param = `${options.legs[0].origin}|${options.legs[0].destination}|${options.legs[0].departure}`;

  let URL = `${THEBARGAINTRIP_URL}?sec1=${sec1Param}&adults=${options.adults}&child=${options.children}&infants=${options.infants}&cabin=${options.cabin}&source=${source}&siteid=${siteid}&token=${THEBARGAINTRIP_TOKEN}`;

  if (input.tripType === 'round') {
    const sec2Param = `${options.legs[1].origin}|${options.legs[1].destination}|${options.legs[1].departure}`;
    URL = URL.concat(`&sec2=${sec2Param}`);
  }

  const data = await axios
    .get(URL)
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err.message);
      return {};
    });

  return data;
};
export default search;
