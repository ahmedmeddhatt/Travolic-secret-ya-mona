import axios from 'axios';
import logger from '../../../../configs/logger';
import { supportedCurrencies } from './pos';
const { AIRPAZ_URL, AIRPAZ_KEY } = process.env;

const transformOption = (options: SearchOptions) => {
  const {
    tripType,
    currency,
    country,
    language,
    legs,
    adults,
    children,
    infants,
    cabinClass
  } = options;
  return {
    tripType,
    currency,
    country,
    language,
    legs,
    adults,
    children,
    infants,
    cabinClass
  };
};

const search = async (input: SearchOptions) => {
  const options = transformOption(input);
  if (options.tripType === 'multi') return {};
  if (!supportedCurrencies.includes(options.currency)) {
    options.currency = 'USD';
  }
  const validCabinClass = 'Economy';
  if (options.cabinClass !== validCabinClass) {
    return {};
  }

  const payload = {
    depAirport: options.legs[0].origin,
    arrAirport: options.legs[0].destination,
    retDate: options.tripType == 'round' ? options.legs[1].departure : '',
    adult: options.adults,
    infant: options.infants,
    child: options.children,
    depDate: options.legs[0].departure,
    currency: options.currency
  };

  let data = await axios
    .post(AIRPAZ_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Affiliate-Key': AIRPAZ_KEY
      }
    })
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err);
      return {};
    });
  if (data['result'] == null) return {};
  do {
    data = await axios
      .post(AIRPAZ_URL, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Affiliate-Key': AIRPAZ_KEY
        }
      })
      .then((res) => res.data)
      .catch((err) => {
        logger.error(err);
        return {};
      });
  } while (data['result']['flights'].length === 0);

  return data;
};

export default search;
