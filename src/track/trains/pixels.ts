import { trackTrainBook } from './track';
import logger from '../../configs/logger';

export const trainTrackingPixel = async (payload): Promise<void> => {
  const { confirmation, provider, price, currency } = payload;

  if (!confirmation || !currency || !price) {
    logger.error('invalid pixel data');
    return;
  }

  const redirectId = payload.sid || payload.redirectId || payload.redirectID;
  const trackData = {
    provider,
    redirectId,
    price,
    currency,
    confirmation
  };

  await trackTrainBook(trackData);
};
