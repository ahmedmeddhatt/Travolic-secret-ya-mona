import axios from 'axios';
import logger from '../../../../configs/logger';
import {
  supportedCountries,
  supportedCurrencies,
  supportedLanguages
} from './POS';
const { BESTTICKETFARE_URL, BESTTICKETFARE_PWD } = process.env;

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

const search = async (input: SearchOptions) => {
  if (
    input.tripType === 'multi' ||
    !supportedCurrencies.includes(input.currency) ||
    !supportedCountries.includes(input.country) ||
    !supportedLanguages.includes(input.language)
  ) {
    return {};
  }

  const transFormedCabinClass = cabinClassMap[input.cabinClass];
  const transformedLegs = formLegs(input.legs);
  let URL = `${BESTTICKETFARE_URL}?Seg1=${transformedLegs[0]}&adults=${input.adults}&child=${input.children}&infants=${input.infants}&cabin=${transFormedCabinClass}&airline=all&siteID=4&utmsource=1002&pwd=${BESTTICKETFARE_PWD}&currency=${input.currency}`;
  if (input.tripType === 'round')
    URL = URL.concat(`&Seg2=${transformedLegs[1]}`);
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
