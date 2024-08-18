import axios from 'axios';
import { CalculateItineraryResult } from './types';
import currencyConverter from '../../middlewares/currencyConverter';
import logger from '../../configs/logger';

const { WHERETOCREDIT_API_URL, WHERETOCREDIT_API_KEY } = process.env;

export const calculate = async (
  options
): Promise<CalculateItineraryResult | any> => {
  const { baseFare, currency, segments } = options;
  const convertCurrency = await currencyConverter('USD');
  const mappedSegments = segments
    .map((segment) => {
      if (!segment.bookingCode) {
        return;
      }
      return {
        origin: segment.origin,
        destination: segment.destination,
        departure: segment.departure,
        carrier: segment.marketingCarrier,
        operatingCarrier: segment.operatingCarrier,
        bookingClass: segment.bookingCode,
        flightNumber: segment.flightNumber
      };
    })
    .filter((segment) => segment);

  if (segments.length !== mappedSegments.length) {
    return {
      data: {}
    };
  }

  const payload = {
    baseFareUSD:
      currency !== 'USD'
        ? convertCurrency(baseFare, currency).toFixed(2)
        : baseFare,
    mappedSegments
  };

  const result = await axios
    .post(`${WHERETOCREDIT_API_URL}/calculate`, [payload], {
      headers: { 'Authorization-Token': WHERETOCREDIT_API_KEY }
    })
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err.response.data.errors);
      return {};
    });

  return { data: result };
};

export const programs = async (): Promise<CalculateItineraryResult | any> => {
  const result = await axios.get(`${WHERETOCREDIT_API_URL}/programs`, {
    headers: { 'Authorization-Token': WHERETOCREDIT_API_KEY }
  });

  return { data: result.data, error: null };
};
