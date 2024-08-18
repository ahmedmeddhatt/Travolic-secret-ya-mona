import axios from 'axios';
import logger from '../../../../configs/logger';
import { supportedCurrencies, deafultCurrency } from './POS';
const { FARECORNER_AF, FARECORNER_URL } = process.env;

const cabinClassMap: IDictionary<string> = {
  Economy: 'Y',
  Business: 'C',
  First: 'F'
};

const formLegs = (legs: SearchOptionLeg[]) => {
  const legsData = [];
  for (const leg of legs) {
    const Data = {
      origin: leg.origin,
      destination: leg.destination,
      departure: leg.departure
    };
    legsData.push(Data);
  }
  return legsData;
};

const transformOptions = (input: SearchOptions) => {
  const { adults, children, currency, infants, cabinClass, legs } = input;
  return {
    adults,
    children,
    infants,
    cabinClass: cabinClassMap[cabinClass],
    legs,
    currency: supportedCurrencies.includes(currency)
      ? currency
      : deafultCurrency
  };
};

const search = async (input: SearchOptions) => {
  if (
    input.tripType === 'multi' ||
    input.language !== 'en' ||
    input.cabinClass === 'Premum_Economy'
  ) {
    return {};
  }

  const options = transformOptions(input);
  const legs = formLegs(options.legs);
  const partner = 'travolic';
  let URL = `${FARECORNER_URL}?depart=${options.legs[0].origin}&arrival=${legs[0].destination}&departOn[]=${legs[0].departure}&af=${FARECORNER_AF}&ch=${partner}&adult=${options.adults}&child=${options.children}&infant=${options.infants}&cabin=${options.cabinClass}&utm_source=${partner}&utm_medium=cpc&utm_campaign=promotional&trip=${input.tripType}`;
  if (input.tripType === 'round')
    URL = URL.concat(`&returnOn=${legs[1].departure}`);
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
