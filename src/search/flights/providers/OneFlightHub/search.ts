import axios from 'axios';
import logger from '../../../../configs/logger';

const {
  ONE_FLIGHT_HUB_START_SEARCH,
  ONE_FLIGHT_HUB_GET_SEARCH_RESULTS,
  ONE_FLIGHT_HUB_USER_NAME,
  ONE_FLIGHT_HUB_PASSWORD
} = process.env;

const classMap: IDictionary<string> = {
  Economy: 'EC',
  PREMIUM_ECONOMY: 'PE',
  BUSINESS: 'BC',
  FIRST: 'FC'
};

const TripTypeMap: IDictionary<string> = {
  oneway: 'O',
  round: 'R'
};

const transformOptions = (options: SearchOptions) => {
  const {
    adults,
    children,
    infants,
    cabinClass,
    origin,
    destination,
    tripType,
    legs,
    currency
  } = options;

  return {
    adults,
    children,
    infants,
    cabinClass: classMap[cabinClass],
    origin,
    destination,
    tripType: TripTypeMap[tripType],
    legs,
    currency
  };
};

const search = async (input: SearchOptions) => {
  const options = transformOptions(input);

  const payload = {
    GeneralInfo: {
      Cabin: options.cabinClass,
      Currency: options.currency,
      GUID: '',
      TripType: options.tripType,
      Username: ONE_FLIGHT_HUB_USER_NAME,
      Password: ONE_FLIGHT_HUB_PASSWORD
    },
    PaxDetails: {
      Adult: options.adults,
      Child: options.children,
      Infant: options.infants
    },
    Segments: [
      {
        DepartApt: options.legs[0].origin,
        ArrivalApt: options.legs[0].destination,
        DepartDate: options.legs[0].departure
      }
    ],
    AdvanceSearch: {
      DirectFlight: false
    }
  };

  if (options.tripType === 'R') {
    payload.Segments.push({
      DepartApt: options.legs[1].origin,
      ArrivalApt: options.legs[1].destination,
      DepartDate: options.legs[1].departure
    });
  }
  const startSearch = await axios
    .post(ONE_FLIGHT_HUB_START_SEARCH, payload)
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err.message);
      return {};
    });
  payload['GeneralInfo']['GUID'] = startSearch;

  let results = await axios
    .post(ONE_FLIGHT_HUB_GET_SEARCH_RESULTS, payload)
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err.message);
      return {};
    });

  while (results['isComplete'] === false) {
    results = await axios
      .post(ONE_FLIGHT_HUB_GET_SEARCH_RESULTS, payload)
      .then((res) => res.data)
      .catch((err) => {
        logger.error(err.message);
        return {};
      });
  }

  return results;
};
export default search;
