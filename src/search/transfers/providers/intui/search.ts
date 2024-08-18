import moment from 'moment';
import axios from 'axios';
import logger from '../../../../configs/logger';

const tripTypesMap: IDictionary<string> = {
  oneway: 'one_way',
  round: 'round_trip'
};

const transformOpions = (options) => {
  const { currency, adults, children, infants, legs, language, tripType } =
    options;

  return {
    legs,
    currency,
    adults,
    children,
    infants,
    language,
    tripType: tripTypesMap[tripType]
  };
};
const search = async (input: SearchTransfersOptions) => {
  if (input.tripType != 'oneway') {
    return {};
  }
  const options = transformOpions(input);
  const supportedCurrency = [
    'EUR',
    'USD',
    'RUB',
    'GBP',
    'AUD',
    'SGD',
    'CNY',
    'CAD',
    'INR',
    'UAH',
    'CHF',
    'ZAR',
    'AED',
    'ILS',
    'HKD',
    'CZK',
    'BRL',
    'JPY'
  ];
  if (!supportedCurrency.includes(options.currency)) {
    options.currency = 'EUR';
  }
  const payload = {
    apikey: 'a00275e56b488b6039e22534125f6b31',
    coordinatesType: 'geo',
    adults: input.adults,
    childs: input.children,
    infants: input.infants,
    gpsLatR: input.legs[0].start_lat,
    gpsLngR: input.legs[0].start_long,
    gpsLatEnd: input.legs[0].end_lat,
    gpsLngEnd: input.legs[0].end_long,
    departureDateTime: moment
      .utc(input.legs[0].departure + 'T' + input.legs[0].time)
      .format('YYYY-MM-DDTHH:mm:ss'),
    arrivalDateTime: moment
      .utc(input.legs[0].departure + 'T' + input.legs[0].time)
      .format('YYYY-MM-DDTHH:mm:ss'),
    currency: options.currency,
    lang: input.language
  };

  const results = await axios
    .post('https://api.intui.travel/ver1_0/GetAvailCar/', payload, {
      headers: {
        'content-type': 'application/json'
      }
    })
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      logger.error(err);
    });

  return results;
};
export default search;
