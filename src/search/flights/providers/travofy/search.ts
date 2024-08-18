import moment from 'moment';
import { createHash } from 'crypto';
import axios from 'axios';
import queryString from 'querystring';
import { createSelectCurrency } from '../../../../utils';
import logger from '../../../../configs/logger';

const { TRAVOFY_API_URL, TRAVOFY_API_KEY, TRAVOFY_ACCOUNT_ID } = process.env;

const selectCurrency = createSelectCurrency(
  ['USD', 'CAD', 'INR', 'AED', 'SAR', 'GBP', 'SGD', 'EGP'],
  'USD'
);

const classMap: IDictionary<string> = {
  Economy: 'Y',
  Premium_Economy: 'W',
  First: 'F',
  Business: 'C'
};

const tripTypeMap: IDictionary<string> = {
  round: 'RT',
  oneway: 'OT'
};

const search = async (input: SearchOptions) => {
  if (input.tripType === 'multi') return {};
  const xSignature = createHash('SHA256')
    .update(TRAVOFY_API_KEY + TRAVOFY_ACCOUNT_ID)
    .digest('hex');

  let query: any = {
    from: input.legs[0].origin,
    to: input.legs[0].destination,
    departdate: moment(input.legs[0].departure, 'YYYY-MM-DD').format(
      'MM-DD-YYYY'
    ),
    triptype: tripTypeMap[input.tripType],
    adt: input.adults,
    chd: input.children,
    inf: input.infants,
    currency: selectCurrency(input.currency),
    cabin: classMap[input.cabinClass]
  };

  if (input.tripType === 'round') {
    query = {
      ...query,
      returnfrom: input.legs[0].destination,
      returnto: input.legs[0].origin,
      returndate: moment(input.legs[1].departure, 'YYYY-MM-DD').format(
        'MM-DD-YYYY'
      )
    };
  }

  const url = `${TRAVOFY_API_URL}?${queryString.stringify(query)}`;

  const data = await axios
    .get(url, {
      headers: {
        apikey: TRAVOFY_API_KEY,
        'x-signature': xSignature
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
