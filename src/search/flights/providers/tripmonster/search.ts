import axios from 'axios';
import moment from 'moment';
import querystring from 'querystring';
import logger from '../../../../configs/logger';

const partner_code = 'd9DIYec4';

const tripTypesMap: IDictionary<boolean> = {
  oneway: true,
  round: false
};

const tripClassMap: IDictionary<string> = {
  Economy: 'Y',
  Premium_Economy: 'W',
  Business: 'C',
  First: 'F'
};

const transformOptions = (options: SearchOptions) => {
  const {
    legs,
    tripType,
    currency,
    adults,
    children,
    infants,
    cabinClass,
    country
  } = options;

  return {
    legs: legs,
    tripType: tripTypesMap[tripType],
    cabinClass: tripClassMap[cabinClass],
    currency,
    adults,
    children,
    infants,
    country
  };
};

const search = async (input: SearchOptions) => {
  if (input.tripType === 'multi') return {};
  const options = transformOptions(input);

  const supportedCountries = [
    'AE',
    'AU',
    'CA',
    'CZ',
    'GB',
    'ID',
    'IE',
    'IL',
    'IN',
    'KW',
    'MY',
    'NG',
    'NZ',
    'OM',
    'PH',
    'PK',
    'QA',
    'SA',
    'SG',
    'US',
    'ZA'
  ];

  if (!supportedCountries.includes(options.country)) {
    options.country = 'US';
  }

  const payload = {
    flow_id: 'B03',
    country: options.country,
    one_way: options.tripType,
    from: options.legs[0].origin,
    to: options.legs[0].destination,
    departure_date: moment.utc(options.legs[0].departure).format('DD-MM-YYYY'),
    adults: options.adults,
    children: options.children,
    infants: options.infants,
    cabin_type: options.cabinClass,
    partner_code: partner_code + options.country,
    return_date: undefined
  };

  if (!options.tripType) {
    payload.return_date = moment
      .utc(options.legs[1].departure)
      .format('DD-MM-YYYY');
  }

  const data = await axios
    .get(
      `https://json-api.tripmonster.com/Flights.aspx?${querystring.stringify(
        payload
      )}`,
      {
        headers: {
          'content-type': 'application/json'
        }
      }
    )
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err);
      return {};
    });

  const result = {
    ...data,
    payload
  };

  return result;
};

export default search;
