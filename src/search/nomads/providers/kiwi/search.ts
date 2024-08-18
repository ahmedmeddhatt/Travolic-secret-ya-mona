import axios from 'axios';
import moment from 'moment';
import querystring from 'query-string';

const { KIWI_NOMAD_API_KEY } = process.env;

const reFormatNomadVia = (locationsArray) => {
  return locationsArray.map((location) => {
    return {
      locations: [location.location],
      nights_range: [location.night_start, location.night_end]
    };
  });
};

const transformOpions = (options) => {
  const {
    currency,
    adults,
    children,
    infants,
    legs,
    language,
    origin,
    destination,
    departure,
    arraival
  } = options;

  return {
    legs,
    currency,
    adults,
    children,
    infants,
    language,
    origin,
    destination,
    departure,
    arraival
  };
};
const search = async (input: SearchOptions) => {
  const options = transformOpions(input);
  const payload = {
    fly_from: options.origin,
    fly_to: options.destination,
    date_from: moment.utc(options.departure).format('DD/MM/YYYY'),
    date_to: moment.utc(options.departure).format('DD/MM/YYYY'),
    adults: options.adults,
    children: options.children,
    infants: options.infants,
    curr: options.currency,
    locale: options.language,
    via: reFormatNomadVia(options.legs)
  };

  const results = await axios
    .post(
      'https://api.tequila.kiwi.com/v2/nomad?' + querystring.stringify(payload),
      payload,
      {
        headers: {
          'content-type': 'application/json',
          apikey: KIWI_NOMAD_API_KEY
        }
      }
    )
    .then((res) => res.data)
    .catch((err) => {
      return { input, err };
    });
  return results;
};
export default search;
