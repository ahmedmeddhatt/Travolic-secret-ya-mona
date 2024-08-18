import axios from 'axios';
import logger from '../../../../configs/logger';
import { Airport, City } from '../../../../models';
import { routes } from './routes';
import newRoutes from './routes2.json';

const { TRAVOPORT_KEY, TRAVOPORT_URL, TRAVOPORT_PWD } = process.env;

const cabinClassMap: IDictionary<string> = {
  Economy: '1',
  Premium_Economy: '2',
  Business: '3',
  First: '4'
};
const supportedCurrencies = ['USD'];

const checkRoutes = async (leg: SearchOptionLeg) => {
  const { origin, destination, orig_city, dest_city } = leg;
  let originCity = orig_city ? origin : null,
    destinationCity = dest_city ? destination : null;

  if (!originCity) {
    const airport = await Airport.findOne({ code: origin });
    originCity = airport ? airport.city.code : '';
  }

  if (!destinationCity) {
    const airport = await Airport.findOne({ code: destination });
    destinationCity = airport ? airport.city.code : '';
  }

  const originCityCode = originCity
    ? await City.findOne({ code: originCity })
    : '';
  const originCountry = originCityCode ? originCityCode.country.code : '';

  const destinationCityCode = destinationCity
    ? await City.findOne({ code: destinationCity })
    : '';
  const destinationCountry = destinationCityCode
    ? destinationCityCode.country.code
    : '';

  if (
    (originCountry === 'US' &&
      (['US', 'CA'].includes(destinationCountry) ||
        routes.includes(destination))) ||
    (destinationCountry === 'US' &&
      (['US', 'CA'].includes(originCountry) || routes.includes(origin)))
  ) {
    return true;
  }

  if (newRoutes[origin] && newRoutes[origin].includes(destination)) return true;

  return false;
};

const transformOptions = (options: SearchOptions) => {
  const { children, cabinClass } = options;

  return {
    childs: children,
    cabin: cabinClassMap[cabinClass]
  };
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
  const check = await checkRoutes(input.legs[0]);

  if (input.tripType === 'multi' || !check) return {};

  const options = transformOptions(input),
    formedLeg = formLegs(input.legs),
    utmsource = 1004,
    siteId = 7,
    airline = 'all',
    currency = supportedCurrencies.includes(input.currency)
      ? input.currency
      : 'USD';

  let URL = `${TRAVOPORT_URL}?seg1=${formedLeg[0]}&cabin=${options.cabin}&adults=${input.adults}&child=${options.childs}&infants=${input.infants}&airline=${airline}&currency=${currency}&utmsource=${utmsource}&pwd=${TRAVOPORT_PWD}&siteid=${siteId}`;

  if (input.tripType === 'round') {
    URL = URL.concat(`&seg2=${formedLeg[1]}`);
  }

  const response = await axios
    .get(URL, {
      headers: {
        Key: TRAVOPORT_KEY
      }
    })
    .then(async (res) => res.data)
    .catch((err) => logger.error(err));

  return response;
};

export default search;
