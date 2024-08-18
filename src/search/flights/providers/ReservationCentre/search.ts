import axios from 'axios';
import logger from '../../../../configs/logger';
import {
  supportedCurrencies,
  deafultCurrency,
  supportedLanguages,
  deafultLanguage
} from './POS';
const { RESERVATION_CENTRE_URL } = process.env;

const cabinClassMap: IDictionary<string> = {
  Economy: 'economy',
  Business: 'business',
  First: 'first'
};

const tripTypeMap: IDictionary<string> = {
  oneway: 'one-way',
  round: 'roundtrip'
};

const transformOptions = (input: SearchOptions) => {
  const { cabinClass, tripType, currency, language } = input;
  return {
    cabinClass: cabinClassMap[cabinClass],
    tripType: tripTypeMap[tripType],
    language: supportedLanguages.includes(input.language)
      ? language
      : deafultLanguage,
    currency: supportedCurrencies.includes(input.currency)
      ? currency
      : deafultCurrency
  };
};

const search = async (input: SearchOptions) => {
  if (input.tripType === 'multi') {
    return {};
  }

  const options = transformOptions(input);
  const from = input.legs[0].origin,
    to = input.legs[0].destination,
    partner = 'travolic',
    password = 'pass';

  let URL = `${RESERVATION_CENTRE_URL}?from=${from}&to=${to}&trip_type=${options.tripType}&class=${options.cabinClass}&outbound_date=${input.legs[0].departure}&adults=${input.adults}&childs=${input.children}&infants=${input.infants}&partner=${partner}&password=${password}&locale=${options.language}&currency=${options.currency}`;
  if (input.tripType === 'round')
    URL = URL.concat(`&inbound_date=${input.legs[1].departure}`);

  const Data = axios
    .get(URL)
    .then((res) => res.data)
    .catch((error) => {
      logger.error(error);
      return {};
    });
  return Data;
};

export default search;
