import axios from 'axios';
import moment from 'moment';
import { supportedCountries, supportedCurrencies } from './pos';
import logger from '../../../../configs/logger';

const { IWOFLY_SEARCH_API_URL } = process.env;

const tripClassMap: IDictionary<string> = {
  Economy: 'Y',
  Premium_Economy: 'S',
  Business: 'C',
  First: 'F'
};

const tripTypeMap: IDictionary<string> = {
  oneway: '1',
  round: '2'
};

const cidMap: IDictionary<string> = {
  US: 'TravolicUS',
  GB: 'TravolicUK',
  CA: 'TravolicCA'
};
const formLegs = (legs: SearchOptionLeg[]) => {
  const legsData = [];
  for (const leg of legs) {
    const Data = {
      ArrivalApt: leg.destination,
      DepartApt: leg.origin,
      DepartDate: moment(leg.departure).format('YYYYMMDD')
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
    tripType: tripTypeMap[tripType]
  };
};

const search = async (input: SearchOptions) => {
  const options = transformOpions(input);
  const formedLegs = formLegs(options.legs);
  if (
    !supportedCountries.includes(options.country) ||
    input.tripType === 'multi'
  ) {
    return {};
  }

  const payload = {
    cid: cidMap[options.country.toUpperCase()],
    tripType: options.tripType,
    fromCity: formedLegs[0].DepartApt,
    toCity: formedLegs[0].ArrivalApt,
    fromDate: formedLegs[0].DepartDate,
    retDate: '',
    adultNumber: options.adults,
    childNumber: options.children,
    InfantNumber: options.infants,
    currency: options.currency,
    cabinGrade: options.cabinClass
  };
  if (input.tripType === 'round') {
    payload['retDate'] = formedLegs[1].DepartDate;
  }

  const data = await axios
    .post(IWOFLY_SEARCH_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        cid: cidMap[options.country.toUpperCase()]
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
