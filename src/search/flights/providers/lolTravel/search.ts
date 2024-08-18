import axios from 'axios';
import moment from 'moment';
import querystring from 'querystring';
import logger from '../../../../configs/logger';
import { supportedCurrencies } from './pos';

const { LOL_TOKEN } = process.env;

const cabinClassMap: IDictionary<string> = {
  Economy: 'ECONOMY',
  First: 'FIRST',
  Business: 'BUSINESS'
};

const tripTypesMap: IDictionary<string> = {
  oneway: 'ONE_WAY',
  round: 'ROUND_TRIP'
};

const transformOpions = (options: SearchOptions) => {
  const { currency, adults, children, infants, legs, language } = options;

  return {
    legs,
    cabinClass: cabinClassMap[options.cabinClass],
    currency,
    tripType: tripTypesMap[options.tripType],
    adults,
    children,
    infants,
    language
  };
};
const search = async (input: SearchOptions) => {
  const options = transformOpions(input);

  if (!supportedCurrencies.includes(options.currency)) {
    options.currency = 'USD';
  }

  const payload = {
    type: options.tripType,
    'searchDestinations[0].departureDate': moment
      .utc(options.legs[0].departure)
      .format('YYYY-MM-DD'),
    'searchDestinations[0].departureAirport.code': options.legs[0].origin,
    'searchDestinations[0].destinationAirport.code':
      options.legs[0].destination,
    'searchPassengers[0].type': 'ADULT',
    'searchPassengers[0].quantity': options.adults,
    'searchPassengers[1].type': 'CHILD',
    'searchPassengers[1].quantity': options.children,
    'searchPassengers[2].type': 'INFANT_WITHOUT_SEAT',
    'searchPassengers[2].quantity': options.infants,
    'loginInfo.agencyCode': 'travoliclolen',
    preferredCabinClass: options.cabinClass,
    preferredCurrencies: options.currency,
    directFlightsOnly: false,
    groupingType: 'NO_GROUPING',
    'loginInfo.operatorName': 'Travolic'
  };

  if (options.tripType == 'ROUND_TRIP') {
    payload['searchDestinations[1].departureDate'] = moment
      .utc(options.legs[1].departure)
      .format('YYYY-MM-DD');
    payload['searchDestinations[1].departureAirport.code'] =
      options.legs[1].origin;
    payload['searchDestinations[1].destinationAirport.code'] =
      options.legs[1].destination;
  }

  const data = await axios
    .get(
      `https://voliwsmeta.easymarketcrs.it/WS_EasyMarketCrs/flightAPI/search?${querystring.stringify(
        payload
      )}`,
      {
        headers: {
          'content-type': 'application/json',
          Authorization: `Basic ${LOL_TOKEN}`,
          Accept: 'application/json'
        }
      }
    )
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err);
      return {};
    });

  return data;
};

export default search;
