import axios from 'axios';
import moment from 'moment';
import querystring from 'querystring';
import xml2js from 'xml2js';
import logger from '../../../../configs/logger';

const parser = new xml2js.Parser();
const partner_code = 'xtrt9hip';

const tripTypesMap: IDictionary<boolean> = {
  oneway: true,
  round: false
};

const cabinClassMap: IDictionary<string> = {
  Economy: 'Y',
  Premium_Economy: 'W',
  First: 'F',
  Business: 'C'
};

const transformOpions = (options: SearchOptions) => {
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
    curr: currency,
    D1: adults,
    D2: children,
    D3: infants,
    trip: tripTypesMap[tripType],
    cabin: cabinClassMap[cabinClass],
    country: country
  };
};
const search = async (input: SearchOptions) => {
  if (input.tripType === 'multi') return {};
  const options = transformOpions(input);

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
    Brand: 'TG',
    Country: options.country,
    AD: options.D1,
    CH: options.D2,
    INF: options.D3,
    Orig: options.legs[0].origin,
    Dest: options.legs[0].destination,
    DepDate: moment.utc(options.legs[0].departure).format('DD-MM-YYYY'),
    Class: options.cabin,
    Partner: partner_code + options.country,
    OW: options.trip,
    ExtraData: true,
    DirectOnly: false,
    LowCost: true,
    IncludeOptionCode: true,
    Includecards: true,
    RetDate: undefined
  };

  if (options.trip === false) {
    payload.RetDate = moment
      .utc(options.legs[1].departure)
      .format('DD-MM-YYYY');
  }

  const data = await axios
    .get(
      'https://xml.travelgenio.com/ResultsXML.aspx?' +
        querystring.stringify(payload),
      {
        headers: {
          'Content-Type': 'application/soap+xml'
        }
      }
    )
    .then((res) => res.data)
    .then((xmlResponse) => parser.parseStringPromise(xmlResponse))
    .catch((err) => {
      logger.error(err);
      return {};
    });

  return data;
};

export default search;
