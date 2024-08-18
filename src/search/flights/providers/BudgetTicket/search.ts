import axios from 'axios';
import logger from '../../../../configs/logger';
import moment from 'moment';
import uuid from 'uuid';

import { supportedAirports, supportedCountry } from './POS';
const { BUDGETTICKET_USERNAME, BUDGETTICKET_PASSWORD, BUDGETTICKET_URL } =
  process.env;

const cabinClassMap: IDictionary<number> = {
  Economy: 0,
  Business: 1,
  First: 2,
  Premium_Economy: 3
};

const tripTypeMap: IDictionary<number> = {
  oneway: 0,
  round: 1
};

const formatLegs = (legs) => {
  const convertedLegs = [];
  legs.forEach((leg) => {
    convertedLegs.push({
      Origin: leg.origin,
      Destination: leg.destination,
      TravelDate: moment.utc(leg.departure, 'YYYY-MM-DD').format('MM/DD/YYYY')
    });
  });
  return convertedLegs;
};

const transformOptions = (options: SearchOptions) => {
  const {
    currency,
    country,
    language,
    legs,
    adults,
    children,
    infants,
    cabinClass,
    userData,
    tripType
  } = options;
  return {
    currency,
    country,
    language,
    legs: formatLegs(legs),
    adultsCount: adults,
    childrenCount: children,
    infantsCount: infants,
    cabin: cabinClassMap[cabinClass],
    userData,
    tripType: tripTypeMap[tripType]
  };
};

const search = async (input: SearchOptions) => {
  if (input.tripType === 'multi' || !supportedCountry.includes(input.country))
    return {};
  const options = transformOptions(input);
  if (
    !supportedAirports.includes(options.legs[0].Origin) ||
    !supportedAirports.includes(options.legs[0].Destination)
  )
    return {};
  const requestId = uuid.v4();
  const IMEI_Number = '2232323232323';
  const payload = {
    Auth_Header: {
      UserId: BUDGETTICKET_USERNAME,
      Password: BUDGETTICKET_PASSWORD,
      Request_Id: requestId,
      IP_Address: options.userData.ip,
      IMEI_Number: IMEI_Number
    },
    Travel_Type: 1,
    Booking_Type: options.tripType,
    TripInfo: options.legs,
    Adult_Count: options.adultsCount,
    Child_Count: options.childrenCount,
    Infant_Count: options.infantsCount,
    Class_Of_Travel: options.cabin
  };

  const data = await axios
    .post(BUDGETTICKET_URL, payload, {
      method: 'post',
      headers: {
        'Content-type': 'application/json'
      }
    })
    .then((res) => res.data)
    .catch((error) => {
      logger.error(error);
      throw new Error('Failed to search for flights');
    });

  return data;
};
export default search;
