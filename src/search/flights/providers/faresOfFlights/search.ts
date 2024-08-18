import axios from 'axios';
import logger from '../../../../configs/logger';
const { FOF_FIRST_URL, FOF_SEC_URL, FOF_USERNAME, FOF_PASSWORD } = process.env;

const cabinClassMap = {
  Economy: 'EC',
  Premium_Economy: 'PE',
  Business: 'BC',
  First: 'FC'
};
const tripTypeMap = {
  oneway: 'O',
  round: 'R'
};

const transformOptions = (options: SearchOptions) => {
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
    tripType: tripTypeMap[tripType],
    currency,
    country,
    language,
    legs,
    adults,
    children,
    infants,
    cabinClass: cabinClassMap[cabinClass]
  };
};

const search = async (input: SearchOptions) => {
  if (input.tripType === 'multi') return {};
  const options = transformOptions(input);
  const payload = {
    AdvanceSearch: {
      DirectFlight: false
    },
    GeneralInfo: {
      Cabin: options.cabinClass,
      Currency: options.currency,
      GUID: '',
      JourneyType: 'INT',
      TripType: options.tripType,
      Username: FOF_USERNAME,
      Password: FOF_PASSWORD,
      IPAddress: '00.00.00.00'
    },
    PaxDetails: {
      Adult: options.adults,
      Child: options.children,
      Infant: options.infants,
      Youth: 0
    },
    Segments: [],
    Source: 'https://travolic.com',
    Device: 'Web'
  };

  for (const leg of options.legs) {
    payload.Segments.push({
      DepartApt: leg.origin,
      ArrivalApt: leg.destination,
      DepartDate: leg.departure
    });
  }
  const GUID = await axios
    .post(FOF_FIRST_URL, payload)
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err);
    });
  payload.GeneralInfo.GUID = GUID;
  const results = [];

  let data = await axios
    .post(FOF_SEC_URL, payload)
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err);
    });
  do {
    data = await axios
      .post(FOF_SEC_URL, payload)
      .then((res) => res.data)
      .catch((err) => {
        logger.error(err);
      });
    results.push(...data.airlines);
  } while (data['isComplete'] === false);
  const retResults = { results, GUID };
  return retResults;
};

export default search;
