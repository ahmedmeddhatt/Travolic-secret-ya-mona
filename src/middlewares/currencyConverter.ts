import axios from 'axios';
import moment from 'moment';
// import cron from 'node-cron';

import { getJSON, setJSON } from '../utils/cache.util';
import logger from '../configs/logger';
import { logApiCall } from '../track';

const { CURRENCY_CONVERSION_API_URL, CURRENCY_CONVERSION_API_KEY } =
  process.env;

const getAllCurrencies = async () => {
  const url = `${CURRENCY_CONVERSION_API_URL}?app_id=${CURRENCY_CONVERSION_API_KEY}`;
  const data = await axios
    .get(url)
    .then((res) => res.data.rates)
    .catch((err) => {
      logger.error(err);
      return {};
    });

  return Object.keys(data);
};
export const cacheAllCurrencies = async () => {
  const baseCurrencies = await getAllCurrencies();
  for (const base of baseCurrencies) {
    const key = `currency-rate-${base}`;
    const cachedRates = await getJSON(key);

    if (cachedRates) {
      logger.info(`CJ Data for ${base} is already cached`);
    } else {
      const currenciesRates = await currencies(base);
      await setJSON(key, currenciesRates, {
        duration: moment.duration({ minutes: 1500 })
      });
      logger.info(`CJ Cached data for ${base}`);
    }
  }
};

// cron.schedule('0 0 * * *', async () => {
//   logger.info('Running cacheAllCurrencies job');
//   try {
//     await cacheAllCurrencies();
//     logger.info('Finished running cacheAllCurrencies job');
//   } catch (err) {
//     logger.error(`Error running cacheAllCurrencies job: ${err.message}`);
//   }
// });
const currencies = async (base: string) => {
  const url = `${CURRENCY_CONVERSION_API_URL}?app_id=${CURRENCY_CONVERSION_API_KEY}&base=${base}`;
  const data = await axios
    .get(url)
    .then((res) => res.data.rates)
    .catch((err: Error) => {
      logger.error(err);
      return {};
    });

  return data;
};

const createConvertCurrency = async (base: string, ip = '::1') => {
  const key = `currency-rate-${base}`;
  let called = 'false';
  let currenciesRates = await getJSON(key);
  if (currenciesRates) {
    logger.info('data already exist ' + currenciesRates);
  }
  if (!currenciesRates) {
    logger.info('data not found in cash');
    currenciesRates = await currencies(base);
    called = 'true';
    await setJSON(key, currenciesRates, {
      duration: moment.duration({
        minutes: 1500
      })
    });
  }
  logApiCall('currency ' + base, currenciesRates, called, ip);

  return (value: number, currency: string) =>
    value * (1 / (base === currency ? 1 : currenciesRates[currency]));
};
// (async () => {
//   logger.info('Running cacheAllCurrencies job M');
//   try {
//     await cacheAllCurrencies();
//     logger.info('Finished running cacheAllCurrencies job M');
//   } catch (err) {
//     logger.error(`Error running cacheAllCurrencies job M ${err.message}`);
//   }
// })();
export default createConvertCurrency;
