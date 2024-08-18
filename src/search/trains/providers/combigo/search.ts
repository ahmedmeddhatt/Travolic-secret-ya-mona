import axios from 'axios';
import logger from '../../../../configs/logger';

const { COMBIGO_API_KEY, COMBIGO_API_SEARCH } = process.env;

const flagRTMap: IDictionary<boolean> = {
  oneway: false,
  round: true
};

const classMap: IDictionary<string> = {
  Economy: 'ECO',
  PREMIUM_ECONOMY: 'ECO_PREMIUM',
  BUSINESS: 'BUSINESS',
  FIRST: 'FIRST_CLASS'
};

const transformOptions = (options: SearchTrainOptions) => {
  const {
    tripType,
    legs,
    currency,
    adults,
    children,
    infants,
    cabinClass,
    language
  } = options;

  return {
    tripType: flagRTMap[tripType],
    legs,
    currency,
    adults,
    children,
    infants,
    cabinClass: classMap[cabinClass],
    language
  };
};

const search = async (input: SearchTrainOptions) => {
  const options = transformOptions(input);

  const supportedCurrencies = [
    'EUR',
    'USD',
    'GBP',
    'ARS',
    'BRL',
    'CAD',
    'DKK',
    'AUD',
    'CLP',
    'CHF',
    'JPY',
    'MXN',
    'NOK',
    'NZD',
    'PEN',
    'COP',
    'SEK',
    'UYU'
  ];
  const supportedLanguages = [
    'fr',
    'en',
    'es',
    'de',
    'cs',
    'da',
    'el',
    'fi',
    'hu',
    'is',
    'it',
    'ja',
    'nl',
    'no',
    'pl',
    'pt',
    'ro',
    'ru',
    'sk',
    'sr',
    'sv',
    'th',
    'zh',
    'uk',
    'tr'
  ];

  if (
    !supportedCurrencies.includes(options.currency) ||
    !supportedLanguages.includes(options.language)
  ) {
    return {};
  }

  const payload = {
    sort: 'RECOMMENDED',
    class: options.cabinClass,
    flagRT: options.tripType,
    currency: options.currency,
    adults: options.adults,
    children: options.children,
    infants: options.infants,
    from: input.origin.location.coordinates.join('|'),
    to: input.destination.location.coordinates.join('|'),
    dTime: options.legs[0].departure,
    groupPricing: true,
    transportInclude: 'TRAIN,BUS',
    lang: options.language
  };

  if (options.tripType === true) {
    payload['dTimeRT'] = options.legs[1].departure;
  }

  const data = await axios
    .post(COMBIGO_API_SEARCH, payload, {
      headers: {
        'Content-type': 'application/json',
        'x-api-key': COMBIGO_API_KEY
      }
    })
    .then((res) => res.data.results)
    .catch((err) => {
      logger.error(err);
      return {};
    });

  return data;
};

export default search;
