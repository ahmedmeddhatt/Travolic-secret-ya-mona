import axios from 'axios';
import logger from '../../../../configs/logger';
import { supportedLanguages, supportedCurrencies } from './pos';

const { COMBIGO_API_KEY, COMBIGO_API_SEARCH, FLIGHT_PROVIDERS_COMBINATION } =
  process.env;

const flagRTMap: IDictionary<boolean> = {
  oneway: false,
  round: true
};

const classMap: IDictionary<string> = {
  Economy: 'ECO'
};

const transformOptions = (options: SearchOptions) => {
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
    language,
    transportInclude: FLIGHT_PROVIDERS_COMBINATION.split(',').includes(
      'combigo'
    )
      ? 'PLANE,TRAIN,BUS'
      : 'PLANE'
  };
};

const search = async (input: SearchOptions) => {
  if (
    !supportedCurrencies.includes(input.currency) ||
    !supportedLanguages.includes(input.language) ||
    input.tripType === 'multi' ||
    input.cabinClass !== 'Economy'
  ) {
    return {};
  }

  const options = transformOptions(input);

  const payload = {
    class: options.cabinClass,
    flagRT: options.tripType,
    currency: options.currency,
    adults: options.adults,
    children: options.children,
    infants: options.infants,
    from: `iata:${options.legs[0].origin}`,
    to: `iata:${options.legs[0].destination}`,
    dTime: options.legs[0].departure,
    groupPricing: true,
    transportInclude: options.transportInclude,
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
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err);
      return {};
    });

  return data;
};

export default search;
