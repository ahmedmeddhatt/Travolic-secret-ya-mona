import axios from 'axios';
import querystring from 'querystring';
import pos from './pos';
import logger from '../../../../configs/logger';

const { TIX_API_URL } = process.env;
const cabinClassMap = {
  Economy: 'ECONOMY',
  Premium_Economy: 'PREMIUM_ECONOMY',
  Business: 'BUSINESS',
  First: 'FIRST'
};

const transformOpions = (options: SearchOptions) => {
  const {
    currency,
    adults,
    children,
    infants,
    cabinClass,
    legs,
    language,
    country,
    tripType
  } = options;

  return {
    legs,
    cabinClass: cabinClassMap[cabinClass],
    currency,
    adults,
    children,
    infants,
    language,
    country,
    tripType
  };
};

const search = async (input: SearchOptions) => {
  if (input.tripType === 'multi') return {};
  const options = transformOpions(input);
  const posData = pos.find((item) => item.country === options.country);
  const payload = {
    departureCode: options.legs[0].origin,
    arrivalCode: options.legs[0].destination,
    departureDate: options.legs[0].departure,
    returnDepartureDate: undefined,
    adults: options.adults,
    children: options.children,
    infants: options.infants,
    cabinClass: options.cabinClass
  };

  if (options.tripType === 'round') {
    payload.returnDepartureDate = options.legs[1].departure;
  }

  const results = [];

  if (!posData) {
    const tixDE = pos.find((item) => item.country === 'DE');
    const tixNL = pos.find((item) => item.country === 'NL');
    const tixBE = pos.find((item) => item.country === 'BE');
    const arr = [tixDE, tixNL, tixBE];
    for (const item of arr) {
      const url = `${TIX_API_URL}?${querystring.stringify(payload)}`;
      const data = await axios
        .get(url, {
          headers: {
            Accept: 'application/json',
            'X-Login': item.login,
            'X-Password': item.password
          }
        })
        .then((res) => res.data)
        .catch((err) => {
          logger.error(err);
          return {};
        });

      results.push({
        provider: item.provider,
        data
      });
    }
  } else {
    const url = `${TIX_API_URL}?${querystring.stringify(payload)}`;
    const data = await axios
      .get(url, {
        headers: {
          Accept: 'application/json',
          'X-Login': posData.login,
          'X-Password': posData.password
        }
      })
      .then((res) => res.data)
      .catch((err) => {
        logger.error(err);
        return {};
      });

    results.push({
      provider: posData.provider,
      data
    });
  }

  return results;
};

export default search;
