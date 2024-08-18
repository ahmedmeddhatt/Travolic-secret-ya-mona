import { trackFlightBook } from './track';
import logger from '../../configs/logger';
import uuid from 'uuid/v4';

const disabledProviders = process.env.DISABLE_FLIGHT_TRACKING_PROVIDERS
  ? process.env.DISABLE_FLIGHT_TRACKING_PROVIDERS.split(',')
  : [];

export const flightTrackingPixel = async (payload): Promise<string> => {
  const { confirmation, provider, price, currency } = payload;
  if (!confirmation || !currency || !price) {
    logger.error('invalid pixel data');
    return 'invalid pixel data';
  }

  if (disabledProviders.includes(provider.toLowerCase())) {
    logger.error('You are restricted');
    return 'You are restricted';
  }

  const redirectId = payload.sid || payload.redirectId || payload.redirectID;
  const trackData = {
    provider,
    redirectId,
    price,
    currency,
    confirmation: `${confirmation}-#-${uuid()}`
  };

  await trackFlightBook(trackData);
  return '';
};
