import axios from 'axios';
import moment from 'moment';
import querystring from 'query-string';
import logger from '../../../../configs/logger';

const search = async (input: SearchTrainOptions) => {
  if (input.tripType === 'multi') {
    return {};
  }

  if (!input.origin.distribusion_code || !input.destination.distribusion_code) {
    return {};
  }

  const payload = {
    departure_date: moment.utc(input.legs[0].departure).format('YYYY-MM-DD'),
    return_date:
      input.tripType === 'round'
        ? moment.utc(input.legs[1].departure).format('YYYY-MM-DD')
        : undefined,
    locale: 'en',
    pax: input.adults + input.children + input.infants,
    currency: input.currency,
    'Accept-Encoding': true
  };

  if (input.legs[0].originPlaceType === 'city') {
    payload['departure_city'] = input.origin.distribusion_code;
  } else {
    payload['departure_stations[]'] = input.origin.distribusion_code;
  }

  if (input.legs[0].destinationPlaceType === 'city') {
    payload['arrival_city'] = input.destination.distribusion_code;
  } else {
    payload['arrival_stations[]'] = input.destination.distribusion_code;
  }

  const url = `https://api.demo.distribusion.com/retailers/v4/connections/find?${querystring.stringify(
    payload
  )}`;

  const results = await axios
    .get(url, {
      headers: {
        'api-key': 'FrmPGFPm0333q8e2aqgPeBvatsyGnnMd36ZgRayF',
        'cache-control': 'no-cache',
        'content-type': 'application/json'
      }
    })
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err.response.data.errors);
      return {};
    });

  return results;
};
export default search;
