import axios from 'axios';
import logger from '../../../../configs/logger';
import moment from 'moment';
import querystring from 'querystring';
import getRemite from './pos';
const cabinClassMap = {
  Economy: 'Y',
  Business: 'C',
  First: 'F'
};
const tripTypeMap = {
  oneway: 'one_way',
  round: 'roundtrip'
};

const transformOptions = (options: SearchOptions) => {
  const {
    tripType,
    currency,
    country,
    language,
    legs,
    adults,
    children,
    infants,
    cabinClass
  } = options;
  return {
    tripType: tripTypeMap[tripType],
    currency,
    country,
    language,
    legs,
    adults,
    children,
    infants,
    cabinClass: cabinClassMap[cabinClass]
  };
};

const search = async (input: SearchOptions) => {
  if (input.cabinClass === 'Premuim_Economy' || input.tripType === 'multi')
    return {};
  const options = transformOptions(input);
  const d1 = moment(options.legs[0].departure);
  const d2 = moment(options.legs[1].departure);
  const numDays =
    options.tripType === 'roundtrip' ? d2.diff(d1, 'days') : undefined;
  const ageArray = [];
  for (let i = 0; i < options.infants; i++) {
    ageArray.push(1);
  }
  for (let i = 0; i < options.children; i++) {
    ageArray.push(5);
  }
  options.children += options.infants;
  const payload = {
    language_code: options.language,
    remite: getRemite(options.country), //add all markets here
    IATA_code: options.legs[0].origin,
    IATA_code_to: options.legs[0].destination,
    checkin: options.legs[0].departure,
    flight_type: options.tripType,
    days: numDays,
    class: options.cabinClass,
    occupancy: `[{"adults":${options.adults} , "children" :${options.children} , "ages":[${ageArray}] }]`
  };

  const data = await axios
    .get(
      `http://haxtransports.destinia.com/json/flights.availability/?${querystring.stringify(
        payload
      )}`
    )
    .then((res) => res.data)
    .catch((error) => {
      logger.error(error);
      throw new Error('Failed to search for flights');
    });
  return data;
};
export default search;
