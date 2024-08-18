import axios from 'axios';
import queryString from 'query-string';
import moment from 'moment';
import logger from '../../../../configs/logger';

const { EUROWINGS_AUTH_TOKEN, EUROWINGS_SEARCH_API } = process.env;
const tripTypeMap: IDictionary<string> = {
  oneway: 'ONE_WAY',
  round: 'ROUND_TRIP'
};

const transformOpions = (options: SearchOptions) => {
  const { legs, tripType } = options;
  return {
    legs,
    tripType: tripTypeMap[tripType]
  };
};

const search = async (input: SearchOptions) => {
  if (input.tripType === 'multi') return {};
  const options = transformOpions(input);
  const payload = {
    departureStationCode: options.legs[0].origin,
    arrivalStationCode: options.legs[0].destination,
    tripType: options.tripType,
    outwardDate: moment(options.legs[0].departure).format('YYYY-MM-DD'),
    returnDate:
      options.tripType === 'ROUND_TRIP'
        ? moment(options.legs[1].departure).format('YYYY-MM-DD')
        : '1970-01-01', //dummy value
    cultureCode: 'en-US'
  };

  const data = await axios
    .get(`${EUROWINGS_SEARCH_API}?${queryString.stringify(payload)}`, {
      headers: {
        authenticationToken: EUROWINGS_AUTH_TOKEN
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
