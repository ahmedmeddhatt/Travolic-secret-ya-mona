import axios from 'axios';
import moment from 'moment';
import { supportedCurrencies } from './pos';
import logger from '../../../../configs/logger';

const { WOWTICKETS_PARTENER, WOWTICKETS_PASSWORD, WOWTICKETS_API_URL } =
  process.env;

const tripClassMap: IDictionary<string> = {
  Economy: 'Y',
  Premium_Economy: 'W',
  Business: 'C',
  First: 'F'
};

const formLegs = (legs: SearchOptionLeg[]) => {
  const legsData = [];
  for (const leg of legs) {
    const Data = {
      ArrivalApt: leg.destination,
      DepartApt: leg.origin,
      DepartDate: moment(leg.departure).format('YYYY-MM-DD')
    };
    legsData.push(Data);
  }
  return legsData;
};
const transformOpions = (options: SearchOptions) => {
  const {
    currency,
    country,
    adults,
    children,
    infants,
    cabinClass,
    tripType,
    legs
  } = options;

  return {
    currency: supportedCurrencies.includes(currency) ? currency : 'USD',
    country,
    adults,
    children,
    infants,
    legs,
    cabinClass: tripClassMap[cabinClass],
    tripType
  };
};

const search = async (input: SearchOptions) => {
  const options = transformOpions(input);
  const formedLegs = formLegs(options.legs);
  if (
    input.tripType === 'multi' ||
    options.cabinClass === 'W' ||
    options.cabinClass === 'F'
  ) {
    // this temperiority until wowtickets resolve first and premium ecommy issue
    return {};
  }

  const params = {
    market: options.country.toUpperCase(),
    from: formedLegs[0].DepartApt,
    to: formedLegs[0].ArrivalApt,
    date1: formedLegs[0].DepartDate,
    adults: options.adults,
    children: options.children,
    infants: options.infants,
    currencyCode: options.currency,
    cabin: options.cabinClass,
    partner: WOWTICKETS_PARTENER,
    password: WOWTICKETS_PASSWORD
  };
  if (input.tripType === 'round') {
    params['date2'] = formedLegs[1].DepartDate;
  }

  const data = await axios
    .get(WOWTICKETS_API_URL, {
      headers: {
        'Content-Type': 'application/json'
      },
      params
    })
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      logger.error(err);
      return {};
    });
  return data;
};

export default search;
