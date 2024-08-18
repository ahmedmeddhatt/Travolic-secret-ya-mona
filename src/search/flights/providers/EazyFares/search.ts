import axios from 'axios';
import logger from '../../../../configs/logger';
import {
  supportedCountries,
  supportedCurrencies,
  supportedLanguages,
  deafultCurrency
} from './POS';
const { EAZYFARES_URL, EAZYFARES_PWD } = process.env;

const cabinClassMap: IDictionary<string> = {
  Economy: '1',
  Premium_Economy: '2',
  Business: '3',
  First: '4'
};

const formLegs = (legs: SearchOptionLeg[]) => {
  const legsData = [];
  for (const leg of legs) {
    const Data = `${leg.origin}|${leg.destination}|${leg.departure}`;
    legsData.push(Data);
  }
  return legsData;
};

const transformOptions = (input: SearchOptions) => {
  const { cabinClass, currency } = input;
  return {
    cabinClass: cabinClassMap[cabinClass],
    currency: supportedCurrencies.includes(currency)
      ? currency
      : deafultCurrency
  };
};

const search = async (input: SearchOptions) => {
  if (
    input.tripType === 'multi' ||
    !supportedCountries.includes(input.country) ||
    !supportedLanguages.includes(input.language)
  ) {
    return {};
  }

  const options = transformOptions(input);
  const transformedLegs = formLegs(input.legs);
  let URL = `${EAZYFARES_URL}?seg1=${transformedLegs[0]}&adults=${input.adults}&child=${input.children}&infants=${input.infants}&cabin=${options.cabinClass}&airline=all&siteid=4&utmsource=1004&pwd=${EAZYFARES_PWD}&currency=${options.currency}`;
  if (input.tripType === 'round')
    URL = URL.concat(`&seg2=${transformedLegs[1]}`);
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
