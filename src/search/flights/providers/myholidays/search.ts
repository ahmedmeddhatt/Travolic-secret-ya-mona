import axios from 'axios';
import xml2js from 'xml2js';
import querystring from 'querystring';
import logger from '../../../../configs/logger';

const parser = new xml2js.Parser();

const cabinClassMap = {
  Economy: 'economy',
  Business: 'business',
  First: 'first'
};

const transformOpions = (options: SearchOptions) => {
  const {
    currency,
    adults,
    children,
    infants,
    cabinClass,
    legs,
    language,
    country,
    tripType
  } = options;

  return {
    legs,
    cabinClass: cabinClassMap[cabinClass],
    currency,
    adults,
    children,
    infants,
    language,
    country,
    tripType
  };
};

const languageMap = {
  en: 'en-GB',
  ar: 'ar-QA',
  fr: 'fr-FR',
  de: 'de-DE'
};

const countryMap = {
  SA: 'SA',
  AE: 'AE',
  EG: 'EG',
  US: 'US',
  DK: 'DK',
  FR: 'FR',
  UK: 'UK',
  IT: 'IT',
  QA: 'QA',
  RU: 'RU',
  CA: 'CA'
};

const search = async (input: SearchOptions) => {
  if (input.tripType === 'multi') {
    return {};
  }

  const options = transformOpions(input);

  const payload = {
    from: options.legs[0].origin,
    to: options.legs[0].destination,
    date1: options.legs[0].departure,
    date2: undefined,
    adt: options.adults,
    chd: options.children,
    inf: options.infants,
    cls: options.cabinClass,
    aff: 1109,
    pwd: 1109,
    currency: options.currency,
    language: Object.prototype.hasOwnProperty.call(
      languageMap,
      options.language
    )
      ? languageMap[options.language]
      : 'en-GB',
    device: 'desktop',
    cn: Object.prototype.hasOwnProperty.call(countryMap, options.country)
      ? countryMap[options.country]
      : 'US'
  };

  if (options.tripType === 'round') {
    payload.date2 = options.legs[1].departure;
  }

  const results = await axios
    .get(
      `http://103.231.208.209:90/api/AffiliateBooking?${querystring.stringify(
        payload
      )}`,
      {
        headers: {
          'Content-Type': 'application/xml'
        }
      }
    )
    .then((response) => response.data)
    .then((xmlResponse) => {
      return parser.parseStringPromise(xmlResponse);
    })
    .then((jsonResponse) => {
      if (jsonResponse.flights.flight[0] === '') {
        return {};
      } else {
        return jsonResponse.flights;
      }
    })
    .catch((err) => {
      logger.error(err);
      return {};
    });

  return results;
};

export default search;
