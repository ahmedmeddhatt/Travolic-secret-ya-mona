import axios from 'axios';
import moment from 'moment';
import logger from '../../../../configs/logger';

const cabinClassMap = {
  Economy: '4',
  Premium_Economy: '3',
  Business: '2',
  First: '1'
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
    tripType,
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
    ReqSearchFares: {
      Search: {
        SessionID: 'abcd123456',
        Origin: options.legs[0].origin,
        Destination: options.legs[0].destination,
        DepartDate: moment.utc(options.legs[0].departure).format('MM/DD/YYYY'),
        ReturnDate:
          options.tripType == 'round'
            ? moment.utc(options.legs[1].departure).format('MM/DD/YYYY')
            : '',
        Adult: options.adults,
        Child: options.children,
        Infant: options.infants,
        CabinClass: options.cabinClass,
        Direct: false,
        JourneyType: options.tripType === 'oneway' ? 'O' : 'R',
        IsFlexible: false,
        Airlines: '',
        Currency: options.currency,
        Company: 'FUD',
        MSource: 'JCT'
      },
      Authentication: {
        AuthCode: '7860000111'
      }
    }
  };

  const data = await axios
    .post('http://api.flyunomundo.com/api/flightservice/', payload)
    .then((res) => res.data)
    .catch((err) => logger.error(err));

  return data;
};

export default search;
