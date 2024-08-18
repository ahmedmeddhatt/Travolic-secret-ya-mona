import moment from 'moment';
import axios from 'axios';
import logger from '../../../../configs/logger';

const { GETTRANSFER_TOKEN } = process.env;

const transformOptions = (options) => {
  const { tripType, legs, adults, children, infants } = options;
  return {
    tripType,
    legs,
    adults,
    children,
    infants
  };
};

const search = async (input) => {
  const options = transformOptions(input);
  const { tripType, legs, adults, children, infants } = options;
  const req_body = {
    transfer: {
      from: {
        name: legs[0].origin,
        point: `(${legs[0].start_lat},${legs[0].start_long})`
      },
      to: {
        name: legs[0].destination,
        point: `(${legs[0].end_lat},${legs[0].end_long})`
      },
      trip_to: {
        date: moment(legs[0].departure, 'YYYY-MM-DD').format('YYYY/MM/DD'),
        time: legs[0].time
      },
      trip_return:
        tripType === 'round'
          ? {
              date: moment(legs[1].departure, 'YYYY-MM-DD').format(
                'YYYY/MM/DD'
              ),
              time: legs[1].time
            }
          : {},
      transport_type_ids: [
        'economy',
        'comfort',
        'business',
        'premium',
        'limousine',
        'suv',
        'van',
        'minibus',
        'bus'
      ],
      pax: adults + children + infants,
      child_seats_infant: infants,
      child_seats_convertible: 0,
      child_seats_booster: children
    }
  };

  const data = await axios
    .post('https://gtrbox.org/api/transfers', req_body, {
      headers: {
        'content-type': 'application/json',
        'X-ACCESS-TOKEN': GETTRANSFER_TOKEN
      }
    })
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err);
      return {};
    });

  if (Object.keys(data).length === 0) return data;
  try {
    const transfer_id = data.data.transfer.id;
    if (Object.keys(data.data.transfer.book_now_offers).length > 0) {
      let offers: any = {};
      let waiting_time = 100;
      do {
        if (waiting_time > 1000) return {};
        await new Promise((resolve) =>
          setTimeout(() => resolve(''), waiting_time)
        );

        offers = await axios
          .get(`https://gtrbox.org/api/transfers/${transfer_id}/offers`, {
            headers: { 'X-ACCESS-TOKEN': GETTRANSFER_TOKEN }
          })
          .then((res) => res.data);
        waiting_time += 100;
      } while (offers.data.offers.length === 0);

      return offers;
    }
  } catch (error) {
    logger.error(error);
    return {};
  }
};

export default search;
