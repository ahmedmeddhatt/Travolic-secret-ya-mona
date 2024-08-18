import axios from 'axios';
import qs from 'querystring';
import { createSelectCurrency } from '../../../../utils';
import logger from '../../../../configs/logger';

const { FLIGHTMOJO_API_URL, FLIGHTMOJO_PASSWORD } = process.env;
const supportedCurrencies = ['USD'];
const selectCurrency = createSelectCurrency(supportedCurrencies, 'USD');

const classMap: IDictionary<string> = {
  Economy: '1',
  Premium_Economy: '2',
  Business: '3',
  First: '4'
};

const search = async (input: SearchOptions) => {
  if (input.tripType === 'multi') return {};
  const basePayload = {
    siteid: 1,
    campain: 1031,
    pwd: FLIGHTMOJO_PASSWORD
  };

  const query = {
    sec1: `${input.legs[0].origin}|${input.legs[0].destination}|${input.legs[0].departure}`,
    sec2:
      input.tripType === 'round'
        ? `${input.legs[1].origin}|${input.legs[1].destination}|${input.legs[1].departure}`
        : undefined,
    adults: input.adults,
    child: input.children,
    infants: input.infants,
    cabin: classMap[input.cabinClass],
    currency: selectCurrency(input.currency),
    airline: 'all',
    ...basePayload
  };

  const results = await axios
    .get(`${FLIGHTMOJO_API_URL}?${qs.stringify(query)}`, {
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

  return results;
};

export default search;
