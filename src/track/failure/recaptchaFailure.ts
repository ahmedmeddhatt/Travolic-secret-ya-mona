import elasitcsearch from '../../configs/elasticsearch';
import logger from '../../configs/logger';

export const recaptchaFailure = async (data): Promise<any> => {
  const prefix = process.env.NODE_ENV === 'dev' ? 'dev_' : '';
  const { visitorId, ip, score, timestamp } = data;
  try {
    if (!elasitcsearch) return null;

    await elasitcsearch.index({
      index: `${prefix}recaptcha_failures`,
      body: {
        visitorId,
        ip,
        score,
        timestamp
      }
    });
  } catch (e) {
    logger.error(e.body);
  }
};
