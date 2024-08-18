import axios from 'axios';
import querystring from 'query-string';
import moment from 'moment';
import logger from '../../../../configs/logger';

const { CROATIA_SEARCH_API, OLYMPICAIR_USER_NAME, OLYMPICAIR_PASSWORD } =
  process.env;

const transformOpions = (options: SearchOptions) => {
  const { legs, currency, adults, children, infants } = options;
  return {
    from: legs[0].origin,
    to: legs[0].destination,
    date: moment.utc(legs[0].departure).format('DD/MM/YYYY'),
    date_return: legs[1]
      ? moment.utc(legs[1].departure).format('DD/MM/YYYY')
      : undefined,
    currency,
    adults,
    children,
    infants
  };
};

const search = async (input: SearchOptions) => {
  if (input.tripType === 'multi') return {};
  const options = transformOpions(input);
  const payload = {
    from: options.from,
    to: options.to,
    date: options.date,
    date_return: options.date_return,
    adults: options.adults,
    children: options.children,
    infants: options.infants,
    format: 'json'
  };
  const data = await axios
    .get(CROATIA_SEARCH_API + '?' + querystring.stringify(payload), {
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
    .then((response) => response.data)
    .catch((err) => {
      logger.error(err.response.data.error);
      return {};
    });

  return data;
};

export default search;
