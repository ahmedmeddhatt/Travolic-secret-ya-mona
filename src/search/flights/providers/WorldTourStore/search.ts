import axios from 'axios';
import logger from '../../../../configs/logger';

const { WORLDTOURS_API_URL, WORLDTOURS_Xclient_id, WORLDTOURS_Xclient_secret } =
  process.env;

const classMap: IDictionary<string> = {
  Economy: 'Y',
  Premium_Economy: 'S',
  Business: 'C',
  First: 'F'
};

const TripTypeMap: IDictionary<string> = {
  oneway: 'O',
  round: 'R'
};

const formatDate = (inputDate) => {
  const dateObj = new Date(inputDate);
  const day = dateObj.getDate().toString().padStart(2, '0');
  const monthIndex = dateObj.getMonth();
  const year = dateObj.getFullYear();
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];

  return `${day}-${monthNames[monthIndex]}-${year}`;
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
    currency,
    country
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
    currency,
    country
  };
};

const search = async (input: SearchOptions) => {
  if (input.tripType === 'multi') return {};
  const options = transformOptions(input);

  const payload = {
    adt: options.adults,
    chd: options.children,
    inf: options.infants,
    cabin: options.cabinClass,
    currency: options.currency,
    country: options.country,
    tripType: options.tripType,
    dep: options.legs[0].origin,
    arr: options.legs[0].destination,
    depDt: formatDate(options.legs[0].departure),
    direct: false
  };

  if (options.tripType === 'R') {
    payload['rtnDt'] = formatDate(options.legs[1].departure);
  }

  const results = await axios
    .post(`${WORLDTOURS_API_URL}`, payload, {
      headers: {
        'X-client-id': WORLDTOURS_Xclient_id,
        'X-client-secret': WORLDTOURS_Xclient_secret
      }
    })
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err.message);
      return {};
    });

  return results;
};
export default search;
