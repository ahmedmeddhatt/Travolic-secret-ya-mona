import axios from 'axios';
import querystring from 'querystring';
import xml2js from 'xml2js';
import logger from '../../../../configs/logger';

const parser = new xml2js.Parser();

const tripTypesMap: IDictionary<string> = {
  oneway: 'one',
  round: 'round'
};

const cabinClassMap: IDictionary<string> = {
  Economy: 'Y',
  Premium_Economy: 'W',
  First: 'F',
  Business: 'C'
};

const transformOpions = (options: SearchOptions) => {
  const { legs, tripType, currency, adults, children, infants, cabinClass } =
    options;

  return {
    cid: 'ST_TRAVOLIC_EN',
    a: 'travolic',
    legs: legs,
    curr: currency,
    D1: adults,
    D2: children,
    D3: infants,
    trip: tripType,
    cabin: cabinClassMap[cabinClass]
  };
};

const search = async (input: SearchOptions) => {
  const options = transformOpions(input);
  const convertedLegs = ConvertLegs(options.legs);
  const { SKYTOURS_URL } = process.env;

  const payload = {
    cid: options.cid,
    a: 'travolic',
    ...convertedLegs,
    D1: options.D1,
    D2: options.D2,
    D3: options.D3,
    curr: options.curr,
    cabin: options.cabin,
    trip: undefined,
    multi: undefined
  };

  if (options.trip == 'multi') {
    payload.trip = tripTypesMap['round'];
    payload.multi = 1;
  } else {
    payload.trip = tripTypesMap[options.trip];
    delete payload.multi;
  }

  const data = await axios
    .get(SKYTOURS_URL + '?' + querystring.stringify(payload), {
      headers: {
        'Content-Type': 'text/soap+xml',
        cid: options.cid
      }
    })
    .then((res) => res.data)
    .then((xmlResponse) => parser.parseStringPromise(xmlResponse))
    .catch((err) => {
      logger.error(err);
      return {};
    });

  return data;
};

const ConvertLegs = (legs: SearchOptionLeg[]) => {
  const flightLegs = {};

  let i = 1;

  for (let index = 0; index < legs.length; index++) {
    const date = `outdate${index + 1}`;

    let t = 'T' + i;

    flightLegs[t] = legs[index].origin;

    i = i + 1;
    t = 'T' + i;
    flightLegs[t] = legs[index].destination;
    flightLegs[date] = legs[index].departure;
    i = i + 1;
  }

  return flightLegs;
};

export default search;
