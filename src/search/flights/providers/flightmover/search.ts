import axios from 'axios';
import moment from 'moment';
import logger from '../../../../configs/logger';
const SESSION_ID = 'abcd123456';
const AUTH_CODE = '7860000111';
const { FLIGHT_MOVER_API_URL } = process.env;

const cabinClassMap = {
  Economy: 'Y',
  Premium_Economy: 'W',
  Business: 'C',
  First: 'F'
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
    ReturnDate:
      tripType == 'round'
        ? moment.utc(options.legs[1].departure).format('MM/DD/YYYY')
        : '',
    infants,
    cabinClass: cabinClassMap[cabinClass]
  };
};

const search = async (options: SearchOptions) => {
  if (options.tripType === 'multi' || options.cabinClass !== 'Economy')
    return {};
  try {
    const {
      tripType,
      legs: [{ origin, destination, departure }],
      adults,
      children,
      infants,
      cabinClass,
      ReturnDate
    } = transformOptions(options);

    const payload = {
      ReqSearchFares: {
        Search: {
          SessionID: SESSION_ID,
          Origin: origin,
          Destination: destination,
          DepartDate: moment.utc(departure).format('MM/DD/YYYY'),
          ReturnDate: ReturnDate,
          Adult: adults,
          Child: children,
          Infant: infants,
          CabinClass: cabinClass,
          Direct: false,
          JourneyType: tripType,
          IsFlexible: false,
          Currency: 'USD',
          Company: 'FMS',
          MSource: 'TRV'
        },
        Authentication: {
          AuthCode: AUTH_CODE
        }
      }
    };

    const response = await axios
      .post(FLIGHT_MOVER_API_URL, payload)
      .then((res) => res.data)
      .catch((err) => {
        logger.error(err);
      });

    return response;
  } catch (error) {
    logger.error(error);
    throw new Error('Failed to search for flights');
  }
};

export default search;
