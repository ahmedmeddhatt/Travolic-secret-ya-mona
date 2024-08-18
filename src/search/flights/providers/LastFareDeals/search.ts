import axios from 'axios';
import logger from '../../../../configs/logger';
import {
  supportedCountries,
  supportedCurrencies,
  supportedLanguages,
  deafultCurrency
} from './pos';

const { LASTFAREDEALS_URL } = process.env;

const cabinClassMap: IDictionary<string> = {
  Economy: 'economy',
  Business: 'business',
  Premium_Economy: 'premium economy',
  First: 'first'
};

const transformOptions = (options: SearchOptions) => {
  const { cabinClass, currency } = options;

  return {
    cabin: cabinClassMap[cabinClass],
    currency: supportedCurrencies.includes(currency)
      ? currency
      : deafultCurrency
  };
};

const formLegs = (legs: SearchOptionLeg[]) => {
  const legsData = [];
  let i = 1;
  for (const leg of legs) {
    const Data = {
      legNumber: i,
      departureCode: leg.destination,
      arrivalCode: leg.origin,
      travelDate: leg.departure
    };
    i++;
    legsData.push(Data);
  }
  return legsData;
};

const search = async (input: SearchOptions) => {
  if (
    input.tripType === 'multi' ||
    !supportedCountries.includes(input.country) ||
    !supportedLanguages.includes(input.language)
  )
    return {};
  const options = transformOptions(input);

  const formedLeg = formLegs(input.legs),
    partner = 'Travelc',
    payload = {
      currencyCode: options.currency,
      adultsCount: input.adults,
      childrenCount: input.children,
      infantsCount: input.infants,
      partner,
      cabin: options.cabin,
      Legs: formedLeg
    };
  const response = await axios
    .post(LASTFAREDEALS_URL, payload)
    .then(async (res) => res.data)
    .catch((err) => logger.error(err));

  return response;
};

export default search;
