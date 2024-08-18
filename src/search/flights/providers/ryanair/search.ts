import axios from 'axios';
import queryString from 'query-string';
import logger from '../../../../configs/logger';

const { RYANAIR_AVAILABILITY_ENDPOINT, RYANAIR_API_KEY } = process.env;

const transformOptions = (options: SearchOptions) => {
  const { legs, adults, children } = options;

  const isRoundTrip = legs.length > 1;

  return {
    ADT: adults,
    CHD: children,
    DateIn: legs[1] ? legs[1].departure : undefined,
    DateOut: legs[0].departure,
    Destination: legs[0].destination,
    RoundTrip: isRoundTrip,
    ToUs: 'AGREED',
    apikey: RYANAIR_API_KEY,
    Origin: legs[0].origin
  };
};

const search = async (input) => {
  const transformedInput = transformOptions(input);
  const results = await axios
    .get(
      `${RYANAIR_AVAILABILITY_ENDPOINT}?${queryString.stringify(
        transformedInput
      )}`
    )
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err);
      return {};
    });

  return results;
};

export default search;
