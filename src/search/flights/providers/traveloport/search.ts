import axios from 'axios';
import { supportedOriginCountries } from './POS';
import logger from '../../../../configs/logger';
import { checkCityAirportCountry } from '../../../../utils/index';

const { TRAVELOPORT_URL, TRAVELOPORT_TOKEN } = process.env;

const cabinClassMap: IDictionary<string> = {
  Economy: '1',
  Premium_Economy: '2',
  Business: '3',
  First: '4'
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
  const origin_country_existed = await checkCityAirportCountry(
    input.legs[0].origin,
    supportedOriginCountries
  );

  if (input.tripType === 'multi' || !origin_country_existed) return {};

  const options = transformOptions(input),
    formedLeg = formLegs(input.legs),
    source = 'TRAVOLIC',
    portal = '2003';

  let URL = `${TRAVELOPORT_URL}?sec1=${formedLeg[0]}&cabin=${options.cabin}&adults=${input.adults}&child=${options.childs}&infants=${input.infants}&token=${TRAVELOPORT_TOKEN}&portal=${portal}&source=${source}`;

  if (input.tripType === 'round') {
    URL = URL.concat(`&sec2=${formedLeg[1]}`);
  }

  const response = await axios
    .get(URL)
    .then(async (res) => res.data)
    .catch((err) => logger.error(err));

  return response;
};

export default search;
