import axios from 'axios';
import querystring from 'querystring';
import logger from '../../../../configs/logger';

const { SECURITY_TOKEN_KIWI_TAXI } = process.env;
const transformOptions = (options) => {
  const { tripType, currency, language, legs, adults, children, infants } =
    options;
  return {
    tripType,
    currency,
    language,
    legs,
    adults,
    children,
    infants
  };
};
const search = async (input: SearchTransfersOptions) => {
  const options = transformOptions(input);
  const payload = {
    lat_from: options.legs[0].start_lat,
    lon_from: options.legs[0].start_long,
    lat_to: options.legs[0].end_lat,
    lon_to: options.legs[0].end_long,
    security_token: SECURITY_TOKEN_KIWI_TAXI
  };

  const url = `https://kiwitaxi.com/services/data/route_transfers?${querystring.stringify(
    payload
  )}`;

  const data = await axios
    .get(url)
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err);
      return {};
    });

  return data;
};
export default search;
