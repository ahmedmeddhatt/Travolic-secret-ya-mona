import fetch from 'node-fetch';
import moment from 'moment';
import logger from '../../../../configs/logger';

const { API_KEY_MOZIO } = process.env;

const tripTypesMap: IDictionary<string> = {
  oneway: 'one_way',
  round: 'round_trip'
};
const transformOpions = (options) => {
  const { currency, adults, children, infants, legs, language } = options;

  return {
    legs,
    currency,
    tripType: tripTypesMap[options.tripType],
    adults,
    children,
    infants,
    language
  };
};
const search = async (input: SearchTransfersOptions) => {
  const options = transformOpions(input);

  const payload = {
    start_lat: input.legs[0].start_lat,
    start_lng: input.legs[0].start_long,
    end_lat: input.legs[0].end_lat,
    end_lng: input.legs[0].end_long,
    pickup_datetime: moment
      .utc(input.legs[0].departure + 'T' + input.legs[0].time)
      .format('YYYY-MM-DDTHH:mm'),
    currency: input.currency,
    num_passengers: input.adults + input.children + input.infants,
    mode: tripTypesMap[input.tripType]
  };
  if (options.tripType == 'round_trip') {
    payload['return_pickup_datetime'] = moment
      .utc(input.legs[1].departure + 'T' + input.legs[1].time)
      .format('YYYY-MM-DDTHH:mm');
  }

  const searchID = await fetch('https://api.mozio.com/v2/search/', {
    method: 'post',
    headers: {
      'content-type': 'application/json',
      'API-KEY': API_KEY_MOZIO
    },
    body: JSON.stringify(payload)
  })
    .then((res) => {
      return res.json();
    })
    .catch((err) => {
      logger.error(err);
      return {};
    });

  let results = await fetch(
    `https://api.mozio.com/v2/search/${searchID.search_id}/poll/`,
    {
      method: 'get',
      headers: {
        'content-type': 'application/json',
        'API-KEY': API_KEY_MOZIO
      }
    }
  )
    .then((res) => {
      return res.json();
    })
    .catch((err) => {
      logger.error(err);
      return {};
    });
  while (results.more_coming == true && results.results.length == 0) {
    results = await fetch(
      `https://api.mozio.com/v2/search/${searchID.search_id}/poll/`,
      {
        method: 'get',
        headers: {
          'content-type': 'application/json',
          'API-KEY': API_KEY_MOZIO
        }
      }
    )
      .then((res) => {
        return res.json();
      })
      .catch((err) => {
        logger.error(err);
        return {};
      });
  }

  return results;
};
export default search;
