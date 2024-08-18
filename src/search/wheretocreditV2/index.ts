import axios from 'axios';
//import { CalculateItineraryResult } from './types';
import logger from '../../configs/logger';

const { WHERETOCREDIT_API_URL, WHERETOCREDIT_API_KEY } = process.env;

export const calculate = async (options) => {
  const { baseFare, currency, segments, ticketingCarrier } = options;
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
    id: '22A22A22A',
    baseFare,
    currency,
    ticketingCarrier,
    segments: mappedSegments
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
