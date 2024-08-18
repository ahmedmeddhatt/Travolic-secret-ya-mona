import axios from 'axios';
import logger from '../../../../configs/logger';

const { TRUAIRFARE_PWD, TRUAIRFARE_UTMSOURCE, TRUAIRFARE_SITEID } = process.env;

const cabinClassMap: IDictionary<string> = {
  Economy: '1',
  Premium_Economy: '2',
  Business: '3',
  First: '4'
};

const convertSegnantFormate = (leg: SearchOptionLeg) => {
  return leg ? `${leg.origin}|${leg.destination}|${leg.departure}` : '';
};

const transformOptions = (options: SearchOptions) => {
  const { legs, adults, children, infants, cabinClass, currency } = options;

  return {
    Seg1: convertSegnantFormate(legs[0]),
    Seg2: convertSegnantFormate(legs[1]),
    currency: currency,
    adult: adults,
    child: children,
    infant: infants,
    cabin: cabinClassMap[cabinClass]
  };
};

const createURL = (options) => {
  const BASE_URL = 'http://api.truairfare.com/Flights/Services';
  const URL = `${BASE_URL}?seg1=${options.Seg1}&seg2=${options.Seg2}&adults=${options.adult}&child=${options.child}&infants=${options.infant}&cabin=${options.cabin}&currency=${options.currency}&siteid=${TRUAIRFARE_SITEID}&utmsource=${TRUAIRFARE_UTMSOURCE}&pwd=${TRUAIRFARE_PWD}`;
  return URL;
};

const search = async (input: SearchOptions) => {
  const options = transformOptions(input);
  const supportedCurrency = ['USD', 'EUR', 'INR', 'CAD', 'MXN'];
  if (!supportedCurrency.includes(options.currency)) {
    options.currency = 'USD';
  }
  const URL = createURL(options);

  const response = await axios
    .get(URL, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then((res) => res.data)
    .catch((err) => logger.error(err));

  return response;
};

export default search;
