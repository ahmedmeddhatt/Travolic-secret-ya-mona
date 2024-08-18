import axios from 'axios';
import logger from '../../../../configs/logger';
import moment from 'moment';
const { FARE_PORTO_URL } = process.env;
const cabinClassMap = {
  Economy: '1',
  Premium_Economy: '2',
  Business: '3',
  First: '4'
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

const generateRandomString = () => {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = Math.floor(Math.random() * 6) + 12;
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const search = async (input: SearchOptions) => {
  if (
    input.tripType == 'multi' ||
    input.country !== 'US' ||
    input.cabinClass == 'Premium_Economy'
  ) {
    return {};
  }

  const options = transformOptions(input);
  const payload = {
    isRoundTrip: options.tripType === 'round',
    adults: options.adults,
    children: options.children,
    infants: options.infants,
    cabin: options.cabinClass,
    flightSegments: [
      {
        from: options.legs[0].origin,
        to: options.legs[0].destination,
        departureDate: moment(options.legs[0].departure).format('DD-MMM-YYYY')
      }
    ],
    browser: 'Chrome',
    device: 'Windows',
    searchId: generateRandomString(),
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    isDeepLink: false,
    webId: 3
  };

  if (options.tripType === 'round') {
    payload.flightSegments.push({
      from: options.legs[1].origin,
      to: options.legs[1].destination,
      departureDate: moment(options.legs[1].departure).format('DD-MMM-YYYY')
    });
  }

  const data = await axios
    .post(FARE_PORTO_URL, payload)
    .then((res) => res.data.data)
    .catch((err) => {
      logger.error(err);
    });
  return data;
};

export default search;
