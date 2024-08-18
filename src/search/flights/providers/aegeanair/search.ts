import axios from 'axios';
import moment from 'moment';
import querystring from 'querystring';
import logger from '../../../../configs/logger';

const { AEGEAN_SEARCH_API, OLYMPICAIR_USER_NAME, OLYMPICAIR_PASSWORD } =
  process.env;

const transformOpions = (options: SearchOptions) => {
  const { legs, currency, adults, children, infants, tripType } = options;
  return {
    from: legs[0].origin,
    to: legs[0].destination,
    date: moment.utc(legs[0].departure).format('DD-MM-YYYY'),
    date_return: legs[1]
      ? moment.utc(legs[1].departure).format('DD-MM-YYYY')
      : undefined,
    currency,
    adults,
    children,
    infants,
    tripType
  };
};

const search = async (input: SearchOptions) => {
  const options = transformOpions(input);
  if (options.tripType === 'multi') return {};
  const payload = {
    from: options.from,
    to: options.to,
    date: options.date,
    currency: options.currency,
    adults: options.adults,
    children: options.children,
    infants: options.infants,
    format: 'json'
  };
  if (options.tripType === 'round') {
    payload['date_return'] = options.date_return;
  }
  const results = await axios
    .get(`${AEGEAN_SEARCH_API}?${querystring.stringify(payload)}`, {
      headers: {
        'content-type': 'application/json',
        Accept: 'text/json',
        Authorization:
          'Basic ' +
          Buffer.from(
            OLYMPICAIR_USER_NAME + ':' + OLYMPICAIR_PASSWORD
          ).toString('base64')
      }
    })
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err.message);
      return {};
    });
  return results;
};

export default search;
