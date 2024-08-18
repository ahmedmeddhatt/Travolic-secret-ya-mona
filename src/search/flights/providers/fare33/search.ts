import axios from 'axios';
import {
  supportedCurrencies,
  supportedLanguages,
  deafultCurrency
} from './pos';
import logger from '../../../../configs/logger';
const { FARE33_METACODE, FARE33_URL } = process.env;

const cabinClassMap: IDictionary<string> = {
  Economy: 'Y',
  Premium_Economy: 'P',
  Business: 'C',
  First: 'F'
};

const tripTypeMap: IDictionary<string> = {
  oneway: 'one',
  round: 'round'
};

const formLegs = (legs: SearchOptionLeg[]) => {
  const legsData = [];
  for (const leg of legs) {
    const Data = {
      origin: leg.origin,
      destination: leg.destination,
      departure: leg.departure,
      orig_city: leg.orig_city,
      dest_city: leg.dest_city
    };
    legsData.push(Data);
  }
  return legsData;
};

const transformOptions = (input: SearchOptions) => {
  const {
    adults,
    children,
    currency,
    infants,
    cabinClass,
    country,
    legs,
    tripType
  } = input;
  return {
    adults,
    children,
    infants,
    cabinClass: cabinClassMap[cabinClass],
    legs,
    country,
    tripType: tripTypeMap[tripType],
    currency: supportedCurrencies.includes(currency)
      ? currency
      : deafultCurrency
  };
};

const search = async (input: SearchOptions) => {
  if (
    input.tripType === 'multi' ||
    input.cabinClass !== 'Economy' ||
    !supportedLanguages.includes(input.language)
  ) {
    return {};
  }

  const options = transformOptions(input);
  const legs = formLegs(options.legs);
  let URL = `${FARE33_URL}?classType=${options.cabinClass}&origin=${
    legs[0].origin
  }&destination=${legs[0].destination}&departureDate=${
    legs[0].departure
  }&tripType=${options.tripType}&adults=${options.adults}&children=${
    options.children
  }&infants=${options.infants}&originType=${
    legs[0].orig_city === true ? 'C' : 'A'
  }&destinationType=${
    legs[0].dest_city === true ? 'C' : 'A'
  }&metaCode=${FARE33_METACODE}`;
  if (input.tripType === 'round')
    URL = URL.concat(`&arrivalDate=${legs[1].departure}`);

  const Data = await axios
    .get(URL, {
      headers: {
        'content-type': 'application/json',
        Accept: 'application/json',
        Origin: 'https://fare33.com'
      }
    })
    .then((res) => res.data)
    .catch((error) => {
      logger.error(error);
      return {};
    });
  return Data;
};

export default search;
