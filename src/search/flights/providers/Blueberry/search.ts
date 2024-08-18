import axios from 'axios';
import moment from 'moment';
import logger from '../../../../configs/logger';
import POS from './pos';

const {
  BLUEBERRY_API_USERNAME_UK,
  BLUEBERRY_API_PASSWORD_UK,
  BLUEBERRY_API_USERNAME_US,
  BLUEBERRY_API_PASSWORD_US
} = process.env;

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
    curr: options.country == 'GB' ? 'GBP' : 'USD',
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

  if (options.tripType === 'multi' || !POS.country.includes(options.country))
    return {};
  const formedLegs = formLegs(input.legs);

  const URL = POS.URL.start[options.country];
  const secondURL = POS.URL.getResult[options.country];

  const payload = {
    AdvanceSearch: {
      DirectFlight: false
    },
    GeneralInfo: {
      Cabin: options.cabin,
      Currency: options.curr,
      GUID: '',
      JourneyType: 'INT',
      TripType: options.tripType,
      Username:
        options.country !== 'GB'
          ? BLUEBERRY_API_USERNAME_UK
          : BLUEBERRY_API_USERNAME_US,
      Password:
        options.country !== 'GB'
          ? BLUEBERRY_API_PASSWORD_UK
          : BLUEBERRY_API_PASSWORD_US,
      IPAddress: '31.6.33.89'
    },
    PaxDetails: {
      Adult: options.adult,
      Child: options.child,
      Infant: options.infant
    },
    Segments: formedLegs
  };

  const GUID = await axios
    .post(URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then((res) => res.data)
    .catch((err) => logger.error(err));

  let retResults = {};
  if (
    typeof GUID === 'string' &&
    GUID !== 'Invalid Credential' &&
    GUID !== ''
  ) {
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
    retResults = { results, GUID };

    return retResults;
  } else {
    return retResults;
  }
};

export default search;
