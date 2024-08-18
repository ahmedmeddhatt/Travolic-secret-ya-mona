import axios from 'axios';
import logger from '../../../../configs/logger';

const { EASE_MY_TRIP_API_URL, EASE_MY_TRIP_PASSWORD, EASE_MY_TRIP_USERNAME } =
  process.env;

const TripTypeMap: IDictionary<number> = {
  oneway: 0,
  round: 1
};

const classMap: IDictionary<number> = {
  Economy: 0,
  FIRST: 1,
  BUSINESS: 2,
  PREMIUM_ECONOMY: 4
};

const transformOptions = (options: SearchOptions) => {
  const {
    tripType,
    legs,
    currency,
    adults,
    children,
    infants,
    cabinClass,
    language
  } = options;

  return {
    tripType: TripTypeMap[tripType],
    legs,
    currency,
    adults,
    children,
    infants,
    cabinClass: classMap[cabinClass],
    language
  };
};

const search = async (input: SearchOptions) => {
  if (input.tripType === 'multi') return {};
  const options = transformOptions(input);

  const payload = {
    Authentication: {
      Password: EASE_MY_TRIP_PASSWORD,
      UserName: EASE_MY_TRIP_USERNAME,
      IpAddress: '10.10.10.10'
    },
    Cabin: options.cabinClass,
    TripType: options.tripType,
    currency: options.currency,
    Adults: options.adults,
    Childs: options.children,
    Infants: options.infants,
    FlightSearchDetails: [
      {
        Origin: options.legs[0].origin,
        Destination: options.legs[0].destination,
        BeginDate: options.legs[0].departure
      }
    ]
  };

  if (options.tripType === 1) {
    payload['FlightSearchDetails'][1] = {
      Origin: options.legs[1].origin,
      Destination: options.legs[1].destination,
      BeginDate: options.legs[1].departure
    };
  }

  const data = await axios
    .post(EASE_MY_TRIP_API_URL, payload, {
      headers: {
        'Content-type': 'text/json'
      }
    })
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err);
      return {};
    });

  return data;
};

export default search;
