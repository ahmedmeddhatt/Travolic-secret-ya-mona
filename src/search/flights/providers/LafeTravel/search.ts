import axios from 'axios';
import moment from 'moment';
import querystring from 'querystring';
import crypto from 'crypto';
import supportedCurrencies from './POS';
import logger from '../../../../configs/logger';
import routes from './routes.json';

const { LAFETRAVEL_SEARCH_API_URL, LAFETRAVEL_APIKEY, LAFETRAVEL_ACCOUNTID } =
  process.env;

const tripClassMap: IDictionary<string> = {
  Economy: 'Y',
  Premium_Economy: 'W',
  Business: 'C',
  First: 'F'
};

const tripTypeMap: IDictionary<string> = {
  oneway: 'OT',
  round: 'RT'
};

const formLegs = (legs: SearchOptionLeg[]) => {
  const legsData = [];
  for (const leg of legs) {
    const Data = {
      to: leg.destination,
      from: leg.origin,
      departdate: moment(leg.departure).format('MM-DD-YYYY')
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
    input.tripType === 'multi' ||
    ((!routes[input.legs[0].origin] ||
      !routes[input.legs[0].origin].includes(input.legs[0].destination)) &&
      (!routes[input.legs[0].destination] ||
        !routes[input.legs[0].destination].includes(input.legs[0].origin)))
  ) {
    return {};
  }

  const payload = {
    triptype: options.tripType,
    from: formedLegs[0].from,
    to: formedLegs[0].to,
    departdate: formedLegs[0].departdate,
    adt: options.adults,
    chd: options.children,
    inf: options.infants,
    src: 'Travolic',
    currency: options.currency,
    cabin: options.cabinClass
  };

  if (input.tripType === 'round') {
    payload['returndate'] = formedLegs[1].departdate;
    payload['returnfrom'] = formedLegs[1].from;
    payload['returnto'] = formedLegs[1].to;
  }

  const xsignature = crypto
    .createHash('SHA256')
    .update(LAFETRAVEL_APIKEY + LAFETRAVEL_ACCOUNTID)
    .digest('hex');

  const URL = `${LAFETRAVEL_SEARCH_API_URL}?${querystring.stringify(payload)}`;

  const data = await axios
    .get(URL, {
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': xsignature,
        apikey: LAFETRAVEL_APIKEY
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
