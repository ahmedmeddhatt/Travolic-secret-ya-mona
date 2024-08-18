import axios from 'axios';
import queryString from 'qs';
import moment from 'moment';

const { OLYMPICAIR_SEARCH_API, OLYMPICAIR_USER_NAME, OLYMPICAIR_PASSWORD } =
  process.env;

const transformOpions = (options: SearchOptions) => {
  const { legs, currency, adults, children, infants } = options;
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
    infants
  };
};

const search = async (input: SearchOptions) => {
  const options = transformOpions(input);

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

  const requestURL = decodeURIComponent(
    `${OLYMPICAIR_SEARCH_API}?${queryString.stringify(payload)}`
  );

  const data = await axios
    .get(requestURL, {
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
    .then((res) => res.data.response.results)
    .catch((err) => err.message);

  return data;
};

export default search;
