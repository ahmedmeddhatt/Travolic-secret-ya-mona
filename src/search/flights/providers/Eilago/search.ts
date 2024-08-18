import axios from 'axios';
import logger from '../../../../configs/logger';

const { EILAGO_API_URL } = process.env;
const cabinClassMap = {
  Economy: 'economy',
  Premium_Economy: 'premium_economy',
  First: 'first',
  Business: 'business'
};

const tripTypesMap: IDictionary<string> = {
  oneway: 'OneWay',
  round: 'RoundTrip',
  multi: 'MultiCity'
};

const transformOpions = (options: SearchOptions) => {
  const {
    legs,
    tripType,
    currency,
    country,
    adults,
    children,
    infants,
    cabinClass
  } = options;
  return {
    legs,
    tripType: tripTypesMap[tripType],
    currency,
    country,
    adults,
    children,
    infants,
    cabinClass: cabinClassMap[cabinClass]
  };
};
const search = async (input: SearchOptions) => {
  const options = transformOpions(input);
  const payload = {
    TripType: options.tripType,

    Partner: 'travolic',
    cabin: options.cabinClass,
    adultsCount: options.adults,
    childrenCount: options.children,
    infantsCount: options.infants,
    locale: input.language,
    currencyCode: options.currency,
    legs: [],
    SessionId: null,
    userid: 0
  };

  for (const leg of options.legs) {
    payload.legs.push({
      departureCode: leg.origin,
      arrivalCode: leg.destination,
      outboundDate: leg.departure
    });
  }

  const data = await axios
    .post(EILAGO_API_URL, payload)
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err);
      return err;
    });

  return data;
};
export default search;
