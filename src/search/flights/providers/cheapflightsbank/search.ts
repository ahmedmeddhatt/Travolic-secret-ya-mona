import axios from 'axios';
import moment from 'moment';
import logger from '../../../../configs/logger';

const { CHEAPFLIGHTSBACK_API_USERNAME, CHEAPFLIGHTSBACK_API_PASSWORD } =
  process.env;

const cabinClassMap: IDictionary<string> = {
  Economy: 'EC',
  Business: 'BC',
  Premium_Economy: 'PE',
  First: 'FC'
};

const tripTypeMap: IDictionary<string> = {
  oneway: 'O',
  round: 'R',
  multi: 'M'
};

const transformOptions = (options: SearchOptions) => {
  const { legs, country, language, adults, children, infants, cabinClass } =
    options;

  return {
    legs: legs,
    curr: 'USD',
    country: country,
    language: language,
    tripType: tripTypeMap[options.tripType],
    adult: adults,
    child: children,
    infant: infants,
    cabin: cabinClassMap[cabinClass]
  };
};

const formLegs = (legs: SearchOptionLeg[]) => {
  const legsData = [];
  for (const leg of legs) {
    const Data = {
      ArrivalApt: leg.destination,
      DepartApt: leg.origin,
      DepartDate: moment(leg.departure).format('YYYY-MM-DD')
    };
    legsData.push(Data);
  }
  return legsData;
};

const search = async (input: SearchOptions) => {
  const options = transformOptions(input);
  if (options.tripType === 'multi') return {};
  const formedLegs = formLegs(input.legs);

  const URL = `http://fapi.cheapflightsbank.com/api/flight/StartSearch`;
  const secondURL = `http://fapi.cheapflightsbank.com/api/flight/getsearchresult`;

  const payload = {
    AdvanceSearch: {
      DirectFlight: false
    },
    GeneralInfo: {
      Cabin: options.cabin,
      Currency: options.curr,
      GUID: '',
      JourneyType: '',
      TripType: options.tripType,
      Username: CHEAPFLIGHTSBACK_API_USERNAME,
      Password: CHEAPFLIGHTSBACK_API_PASSWORD
    },
    PaxDetails: {
      Adult: options.adult,
      Child: options.child,
      Infant: options.infant
    },
    Segments: formedLegs
  };
  payload.GeneralInfo.JourneyType = 'INT';

  const GUID = await axios
    .post(URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then((res) => res.data)
    .catch((err) => logger.error(err));

  payload.GeneralInfo.GUID = GUID;
  const results = [];
  let flag = false;
  do {
    const Data = await axios
      .post(secondURL, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then((res) => res.data)
      .catch((err) => logger.error(err));
    results.push(...Data.airlines);
    flag = Data.isComplete;
  } while (!flag);
  const retResults = { results, GUID };
  return retResults;
};

export default search;
