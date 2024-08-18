import axios from 'axios';
import moment from 'moment';
import { createSelectCurrency } from '../../../../utils';
import logger from '../../../../configs/logger';

const {
  REHLAT_API_USER_NAME,
  REHLAT_API_PASSWORD,
  REHLAT_API_SOURCE,
  REHLAT_SEARCH_API_URL
} = process.env;

const supportedCurrencies = [
  'USD',
  'AED',
  'BHD',
  'EGP',
  'INR',
  'JOD',
  'KWD',
  'OMR',
  'QAR',
  'SAR'
];
const selectCurrency = createSelectCurrency(supportedCurrencies, 'USD');

const tripTypesMap: IDictionary<string> = {
  oneway: 'OneWay',
  round: 'RoundTrip'
};

const transformOpions = (options: SearchOptions) => {
  const { legs, tripType, currency, adults, children, infants, cabinClass } =
    options;
  return {
    from: legs[0].origin,
    to: legs[0].destination,
    tripType: tripTypesMap[tripType],
    departureDate: moment.utc(legs[0].departure).format('YYYYMMDD'),
    returnDate: legs[1]
      ? moment.utc(legs[1].departure).format('YYYYMMDD')
      : undefined,
    currency,
    adults,
    children,
    infants,
    cabinClass
  };
};

const search = async (input: SearchOptions) => {
  const options = transformOpions(input);

  const basePayload = {
    UserName: REHLAT_API_USER_NAME,
    Password: REHLAT_API_PASSWORD,
    Source: REHLAT_API_SOURCE
  };

  const payload = {
    ...basePayload,
    TripType: options.tripType,
    From: options.from,
    To: options.to,
    DepartureDate: options.departureDate,
    ReturnDate: options.returnDate,
    Currency: selectCurrency(options.currency),
    Adults: options.adults,
    Children: options.children,
    Infant: options.infants,
    CLASS: options.cabinClass
  };

  const data = await axios
    .post(REHLAT_SEARCH_API_URL, JSON.stringify(payload), {
      method: 'post',
      headers: {
        'content-type': 'application/json',
        Accept: 'text/json'
      }
    })
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err);
      return {};
    });

  return data;
};

export default search;
