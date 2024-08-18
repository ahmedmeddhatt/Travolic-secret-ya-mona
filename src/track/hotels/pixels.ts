import { trackHotelBook } from './track';
import logger from '../../configs/logger';

const disabledProviders = process.env.DISABLE_HOTEL_TRACKING_PROVIDERS
  ? process.env.DISABLE_HOTEL_TRACKING_PROVIDERS.split(',')
  : [];

export const hotelTrackingPixel = async (payload): Promise<string> => {
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
    confirmation
  };

  await trackHotelBook(trackData);
  return '';
};
