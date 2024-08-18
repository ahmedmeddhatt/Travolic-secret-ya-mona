import elasticsearch from '../../configs/elasticsearch';
import logger from '../../configs/logger';

const prefix = process.env.NODE_ENV === 'dev' ? 'dev_' : '';

export const getVisitor = async (visitorId: string) => {
  try {
    if (!elasticsearch) return null;

    const {
      hits: { hits }
    } = await elasticsearch.search({
      index: `visitors`,
      body: {
        query: {
          match: {
            _id: visitorId
          }
        }
      }
    });

    return hits.length === 0 ? {} : hits[0]._source;
  } catch (error) {
    logger.error(error.body);
  }
};

export const trackVisitor = async (data: any): Promise<void> => {
  try {
    if (!elasticsearch) return null;

    await elasticsearch.index({
      index: `${prefix}visitors`,
      id: data.visitorId,
      body: {
        visitorId: data.visitorId,
        ip: data.ip,
        city: data.city,
        countryCode: data.countryCode,
        countryName: data.countryName,
        language: data.language,
        location: data.location,
        timestamp: data.timestamp,
        userId: data.userId
      }
    });
  } catch (error) {
    logger.error(error.body);
  }
};
