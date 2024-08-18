import axios from 'axios';
import moment from 'moment';
import querystring from 'querystring';

const { API_KEY_JAYRIDE, API_KEY_DISTANCE_MATRIX } = process.env;

const transformOptions = (options) => {
  const { tripType, currency, language, legs, adults, children, infants } =
    options;
  return {
    tripType,
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
    from_location: {},
    to_location: {},
    include_return_trip: options.tripType === 'oneway' ? false : true,
    flight: {},
    passenger: {
      count: options.adults + options.children + options.infants
    }
  };

  if (options.tripType == 'oneway') {
    if (options.legs[0].from_type == 'airport-terminal') {
      (payload.from_location = {
        type: 'airport-terminal',
        description: options.legs[0].des_from,
        lat: options.legs[0].start_lat,
        lng: options.legs[0].start_long
      }),
        (payload.to_location = {
          type: options.legs[0].to_type,
          description: options.legs[0].des_to,
          lat: options.legs[0].end_lat,
          lng: options.legs[0].end_long
        }),
        (payload.flight = {
          landing_datetime_local: moment
            .utc(input.legs[0].departure + 'T' + input.legs[0].time)
            .format('YYYY-MM-DDTHH:mm')
        });
    } else if (options.legs[0].from_type == 'hotel') {
      (payload.from_location = {
        type: 'hotel',
        description: options.legs[0].des_from,
        lat: options.legs[0].start_lat,
        lng: options.legs[0].start_long
      }),
        (payload.to_location = {
          type: 'airport-terminal',
          description: options.legs[0].des_to,
          lat: options.legs[0].end_lat,
          lng: options.legs[0].end_long
        }),
        (payload.flight = {
          departure_datetime_local: moment
            .utc(input.legs[0].departure + 'T' + input.legs[0].time)
            .format('YYYY-MM-DDTHH:mm')
        });
    } else {
      (payload.from_location = {
        type: 'address',
        description: options.legs[0].des_from,
        lat: options.legs[0].start_lat,
        lng: options.legs[0].start_long
      }),
        (payload.to_location = {
          type: 'airport-terminal',
          description: options.legs[0].des_to,
          lat: options.legs[0].end_lat,
          lng: options.legs[0].end_long
        }),
        (payload.flight = {
          departure_datetime_local: moment
            .utc(input.legs[0].departure + 'T' + input.legs[0].time)
            .format('YYYY-MM-DDTHH:mm')
        });
    }
  } else {
    if (options.legs[0].from_type == 'airport-terminal') {
      (payload.from_location = {
        type: 'airport-terminal',
        description: options.legs[0].des_from,
        lat: options.legs[0].start_lat,
        lng: options.legs[0].start_long
      }),
        (payload.to_location = {
          type: options.legs[0].to_type,
          description: options.legs[0].des_to,
          lat: options.legs[0].end_lat,
          lng: options.legs[0].end_long
        }),
        (payload.flight = {
          landing_datetime_local: moment
            .utc(input.legs[0].departure + 'T' + input.legs[0].time)
            .format('YYYY-MM-DDTHH:mm'),
          departure_datetime_local: moment
            .utc(input.legs[1].departure + 'T' + input.legs[1].time)
            .format('YYYY-MM-DDTHH:mm')
        });
    } else if (options.legs[0].from_type == 'hotel') {
      (payload.from_location = {
        type: 'hotel',
        description: options.legs[0].des_from,
        lat: options.legs[0].start_lat,
        lng: options.legs[0].start_long
      }),
        (payload.to_location = {
          type: 'airport-terminal',
          description: options.legs[0].des_to,
          lat: options.legs[0].end_lat,
          lng: options.legs[0].end_long
        }),
        (payload.flight = {
          landing_datetime_local: moment
            .utc(input.legs[1].departure + 'T' + input.legs[1].time)
            .format('YYYY-MM-DDTHH:mm'),
          departure_datetime_local: moment
            .utc(input.legs[0].departure + 'T' + input.legs[0].time)
            .format('YYYY-MM-DDTHH:mm')
        });
    } else {
      (payload.from_location = {
        type: 'address',
        description: options.legs[0].des_from,
        lat: options.legs[0].start_lat,
        lng: options.legs[0].start_long
      }),
        (payload.to_location = {
          type: 'airport-terminal',
          description: options.legs[0].des_to,
          lat: options.legs[0].end_lat,
          lng: options.legs[0].end_long
        }),
        (payload.flight = {
          landing_datetime_local: moment
            .utc(input.legs[1].departure + 'T' + input.legs[1].time)
            .format('YYYY-MM-DDTHH:mm'),
          departure_datetime_local: moment
            .utc(input.legs[0].departure + 'T' + input.legs[0].time)
            .format('YYYY-MM-DDTHH:mm')
        });
    }
  }

  const p2 = {
    origins: options.legs[0].start_lat + ',' + options.legs[0].start_long,
    destinations: options.legs[0].end_lat + ',' + options.legs[0].end_long,
    key: API_KEY_DISTANCE_MATRIX
  };

  const url2 =
    `https://maps.googleapis.com/maps/api/distancematrix/json?` +
    querystring.stringify(p2);

  const matrix = await axios
    .post(url2)

    .then((res) => res.data)
    .catch((err) => {
      return err;
    });

  const url = `https://api.jayride.com/v3/quote-request?key=${API_KEY_JAYRIDE}`;

  const data = await axios
    .post(url, payload)

    .then((res) => res.data)
    .catch((err) => {
      return err;
    });
  const jayrideTimeBySeconds = matrix.rows[0].elements[0].duration.value;

  // convert time value from seconds to minutes
  data.time = Math.ceil(jayrideTimeBySeconds / 60);

  return data;
};

export default search;
