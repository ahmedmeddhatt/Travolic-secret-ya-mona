import axios from 'axios';
import querystring from 'query-string';
import logger from '../../../../configs/logger';

const { MILHAS_123_URL, MILHAS_123_KEY } = process.env;
const cabinClassMap = {
  Economy: '3',
  Business: '2'
};
const transformOptions = (options: SearchOptions) => {
  const {
    legs,
    tripType,
    currency,
    country,
    adults,
    children,
    infants,
    cabinClass
  } = options;
  return {
    legs,
    tripType,
    currency,
    country,
    adults,
    children,
    infants,
    cabinClass: cabinClassMap[cabinClass]
  };
};
//not support infants
const search = async (input: SearchOptions) => {
  const options = transformOptions(input);
  const payload = {
    iata_from: options.legs[0].origin,
    iata_to: options.legs[0].destination,
    adults: options.adults,
    children: options.children,
    babies: options.infants,
    class_service: options.cabinClass,
    date_outbound: options.legs[0].departure,
    date_inbound: options.tripType == 'round' ? options.legs[1].departure : ''
  };
  if (options.tripType === 'multi') return {};

  const data = await axios
    .get(`${MILHAS_123_URL}?${querystring.stringify(payload)}`, {
      headers: {
        Authorization: `${MILHAS_123_KEY}`
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
