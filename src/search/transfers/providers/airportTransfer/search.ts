import axios from 'axios';
import moment from 'moment';
import querystring from 'query-string';
import { Airport } from '../../../../models';

const { API_KEY_DISTANCE_MATRIX, API_KEY_AIRPORT_TRANSFERS } = process.env;

const tripTypesMap: IDictionary<string> = {
  oneway: 'ONEWAY',
  round: 'ROUNDTRIP'
};

const transformOptions = (options) => {
  const { tripType, currency, language, legs, adults, children, infants } =
    options;
  return {
    tripType: tripTypesMap[tripType],
    currency,
    language,
    legs,
    adults,
    children,
    infants
  };
};
const search = async (input: SearchTransfersOptions) => {
  const options = transformOptions(input);
  const payload = {
    booking_type: options.tripType,
    pickup_location: {},
    drop_of_location: {},
    flight_arrival: moment
      .utc(input.legs[0].departure + 'T' + input.legs[0].time)
      .format('YYYY-MM-DD HH:mm'),

    return:
      input.tripType === 'round'
        ? moment
            .utc(input.legs[1].departure + 'T' + input.legs[1].time)

            .format('YYYY-MM-DD HH:mm')
        : undefined,
    travelers: {
      adult: options.adults,
      children: options.children,
      infant: options.infants
    }
  };

  if (options.legs[0].from_type == 'airport') {
    const lat = options.legs[0].start_lat;
    const lng = options.legs[0].start_long;

    const rs = await Airport.findOne({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $minDistance: 10,
          $maxDistance: 40 * 1000
        }
      },
      isActive: true
    });

    (payload.pickup_location = {
      location_id: rs.code,
      type: 'AIRPORT'
    }),
      (payload.drop_of_location = {
        location_id: options.legs[0].destination,
        type: 'PLACE'
      });
  } else if (options.legs[0].to_type == 'airport') {
    const lat = options.legs[0].start_lat;
    const lng = options.legs[0].start_long;

    const rs = await Airport.findOne({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $minDistance: 10,
          $maxDistance: 40 * 1000
        }
      },
      isActive: true
    });

    (payload.pickup_location = {
      location_id: options.legs[0].origin,
      type: 'PLACE'
    }),
      (payload.drop_of_location = {
        location_id: rs.code,
        type: 'AIRPORT'
      });
  }

  const payloadMatrix = {
    origins: options.legs[0].start_lat + ',' + options.legs[0].start_long,
    destinations: options.legs[0].end_lat + ',' + options.legs[0].end_long,
    key: API_KEY_DISTANCE_MATRIX
  };

  const distanceMatrix = await axios
    .get(
      `https://maps.googleapis.com/maps/api/distancematrix/json?` +
        querystring.stringify(payloadMatrix)
    )
    .then((res) => res.data)
    .catch((err) => {
      return err;
    });

  const url = 'https://api.airporttransfer.com/api/partner/quotes';
  const data = await axios
    .post(url, payload, {
      headers: {
        'X-Api-Key': API_KEY_AIRPORT_TRANSFERS
      }
    })
    .then((res) => res.data)
    .catch((err) => {
      return err;
    });
  const airportTimeBySeconds =
    distanceMatrix.rows[0].elements[0].duration.value;

  // convert time value from seconds to minutes
  data.time = Math.ceil(airportTimeBySeconds / 60);

  return data;
};

export default search;
