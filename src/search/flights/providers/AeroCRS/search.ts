import axios from 'axios';
import moment from 'moment';
import logger from '../../../../configs/logger';

const { AEROCRS_AUTH_ID, AEROCRS_AUTH_PASSWORD } = process.env;

const transformOpions = (options: SearchOptions) => {
  const { legs, currency, adults, children, infants, cabinClass } = options;
  return {
    legs,
    currency,
    adults,
    children,
    infants,
    cabinClass
  };
};

export const search = async (options: SearchOptions) => {
  const input = transformOpions(options);

  let url = `https://api.aerocrs.com/v5/getDeepLink?from=${
    input.legs[0].origin
  }&to=${input.legs[0].destination}&adults=${input.adults}&infant=${
    input.infants
  }&child=${input.children}&start=${moment(input.legs[0].departure).format(
    'YYYY/MM/DD'
  )}`;

  if (options.tripType === 'round') {
    url += `&end=${moment(input.legs[1].departure).format('YYYY/MM/DD')}`;
  }

  const results = await axios
    .get(url, {
      headers: {
        'Content-Type': 'application/json',
        auth_id: AEROCRS_AUTH_ID,
        auth_password: AEROCRS_AUTH_PASSWORD
      }
    })
    .then((res) => res.data)
    .catch((err) => logger.error(err.response.data.aerocrs));

  return results;
};

export default search;
