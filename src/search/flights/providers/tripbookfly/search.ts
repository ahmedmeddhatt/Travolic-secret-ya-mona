import axios from 'axios';
import logger from '../../../../configs/logger';
import { supportedCountries } from './pos';

const { TRIPBOOKFLY_PWD, TRIPBOOKFLY_SOURCE, TRIPBOOKFLY_SITEID } = process.env;

const cabinClassMap: IDictionary<string> = {
  Economy: '1',
  Premium_Economy: '2',
  Business: '3',
  First: '4'
};

const convertSegnantFormate = (leg: SearchOptionLeg) => {
  return leg ? `${leg.origin}%7C${leg.destination}%7C${leg.departure}` : '';
};

const transformOptions = (options: SearchOptions) => {
  const { legs, adults, children, infants, cabinClass, country } = options;

  return {
    Sec1: convertSegnantFormate(legs[0]),
    Sec2: convertSegnantFormate(legs[1]),
    currency: 'USD',
    adult: adults,
    child: children,
    infant: infants,
    country: country,
    cabin: cabinClassMap[cabinClass]
  };
};

const createURL = (options) => {
  const BASE_URL = 'http://api.tripbookfly.com/Flights/Services';
  const URL = `${BASE_URL}?sec1=${options.Sec1}&sec2=${options.Sec2}&adults=${options.adult}&child=${options.child}&infants=${options.infant}&cabin=${options.cabin}&airline=all&siteid=${TRIPBOOKFLY_SITEID}&source=${TRIPBOOKFLY_SOURCE}&pwd=${TRIPBOOKFLY_PWD}&currency=${options.currency}`;
  return URL;
};

const search = async (input: SearchOptions) => {
  if (
    input.tripType === 'multi' ||
    !supportedCountries.includes(input.country) ||
    input.cabinClass === 'Premium_Economy'
  )
    return {};

  const options = transformOptions(input);

  const URL = createURL(options);

  // console.log(URL);
  const response = await axios
    .get(URL, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err);
      throw new Error('Failed to search for flights');
    });

  return response;
};

export default search;
