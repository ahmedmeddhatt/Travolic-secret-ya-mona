import axios from 'axios';
import { supportedCurrencies } from './pos';
import logger from '../../../../configs/logger';

const { ATOB_TRANSFER_KEY, ATOB_TRANSFER_URL } = process.env;

const transformOpions = (options) => {
  const { currency, adults, children, infants, legs, tripType } = options;

  return {
    legs,
    currency,
    adults,
    children,
    infants,
    tripType
  };
};

const search = async (input: SearchTransfersOptions) => {
  if (!supportedCurrencies.includes(input.currency)) {
    return {};
  }

  const options = transformOpions(input);

  let payload = {};
  const pax_number = options.adults + options.children + options.infants;

  const booking_payload = {
    pickup_location: options.legs[0].des_from,
    dropoff_location: options.legs[0].des_to,
    date_time: `${options.legs[0].departure} ${options.legs[0].time}`,
    pax: pax_number
  };

  if (input.tripType === 'oneway') {
    payload = {
      currency: input.currency,
      booking: booking_payload
    };
  } else if (input.tripType === 'round') {
    payload = {
      currency: input.currency,
      booking: booking_payload,
      return_booking: {
        pickup_location: options.legs[1].des_from,
        dropoff_location: options.legs[1].des_to,
        date_time: `${options.legs[1].departure} ${options.legs[1].time}`,
        pax: pax_number
      }
    };
  }

  const results = await axios
    .post(ATOB_TRANSFER_URL, payload, {
      headers: {
        Authorization: `Bearer ${ATOB_TRANSFER_KEY}`
      }
    })
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err);
      return {};
    });
  return results;
};
export default search;
