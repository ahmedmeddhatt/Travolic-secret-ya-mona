import axios from 'axios';
import moment from 'moment';
import logger from '../../../../configs/logger';
import uuid from 'uuid';

const { EXCELFARES_URL, EXCELFARES_AUTHCODE } = process.env;

const cabinClassMap: IDictionary<string> = {
  Economy: 'Y',
  Business: 'C',
  First: 'F'
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
    cabin: cabinClassMap[cabinClass],
    ip: options.userData.ip
  };
};

const formLegs = (legs: SearchOptionLeg[]) => {
  const legsData = [];
  for (const leg of legs) {
    const Data = {
      Destination: leg.destination,
      Origin: leg.origin,
      DepartDate: moment(leg.departure).format('MM/DD/YYYY')
    };
    legsData.push(Data);
  }
  return legsData;
};

const search = async (input: SearchOptions) => {
  if (input.tripType === 'multi' || input.cabinClass === 'Premium_Economy')
    return {};
  const options = transformOptions(input);
  const formedLegs = formLegs(input.legs);
  const source = 'TRV';
  const company = 'EXF';
  const sessionID = uuid.v4();

  const payload = {
    ReqSearchFares: {
      Search: {
        SessionID: sessionID,
        Origin: formedLegs[0].Origin,
        Destination: formedLegs[0].Destination,
        DepartDate: formedLegs[0].DepartDate,
        ReturnDate:
          input.tripType === 'round' ? formedLegs[1].DepartDate : undefined,
        Adult: options.adult,
        Child: options.child,
        Infant: options.infant,
        CabinClass: options.cabin,
        Direct: 'false',
        JourneyType: options.tripType,
        IsFlexible: 'false',
        Currency: 'USD',
        Company: company,
        MSourse: source
      },
      Authentication: {
        AuthCode: EXCELFARES_AUTHCODE
      }
    }
  };

  const Data = await axios
    .post(EXCELFARES_URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then((res) => res.data)
    .catch((err) => logger.error(err));
  return Data;
};

export default search;
