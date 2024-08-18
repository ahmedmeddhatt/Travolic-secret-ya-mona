import axios from 'axios';
import moment from 'moment';
import logger from '../../../../configs/logger';

const {
  TRAVOMINT_CLIENT,
  TRAVOMINT_AUTH_CODE,
  TRAVOMINT_SITE_ID,
  TRAVOMINT_SEARCH_API_URL
} = process.env;

const tripTypesMap: IDictionary<number> = {
  oneway: 1,
  round: 2
};

const tripClassMap: IDictionary<number> = {
  Economy: 1,
  Premium_Economy: 2,
  Business: 3,
  First: 4
};

const convertLegs = (legs: SearchOptionLeg[]) => {
  const flightLegs = [];

  for (const leg of legs) {
    const { origin, destination, departure } = leg;
    const arr = {};

    arr['originAirport'] = origin;
    arr['destinationAirport'] = destination;
    arr['travelDate'] = moment.utc(departure).format('MM/DD/YYYY');

    flightLegs.push(arr);
  }

  return flightLegs;
};

const transformOpions = (options: SearchOptions) => {
  if (options.tripType === 'multi') return {};
  const { legs, tripType, currency, adults, children, infants, cabinClass } =
    options;
  return {
    legs: convertLegs(legs),
    tripType: tripTypesMap[tripType],
    cabinClass: tripClassMap[cabinClass],
    currency,
    adults,
    children,
    infants
  };
};

const search = async (input: SearchOptions) => {
  const options = transformOpions(input);

  const basePayload = {
    client: TRAVOMINT_CLIENT,
    siteId: TRAVOMINT_SITE_ID,
    searchID: Math.random(),
    userIP: '0:0:0:0:0:0:0:1'
  };

  const payload = {
    ...basePayload,
    tripType: options.tripType,
    segment: options.legs,
    currencyCode: options.currency,
    adults: options.adults,
    child: options.children,
    infants: options.infants,
    cabinType: options.cabinClass,
    infantsWs: 0
  };

  const data = await axios
    .post(
      `${TRAVOMINT_SEARCH_API_URL}?authcode=${TRAVOMINT_AUTH_CODE}`,
      JSON.stringify(payload),
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

  return data;
};

export default search;
