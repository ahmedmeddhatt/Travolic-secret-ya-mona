import elasticsearch from '../../configs/elasticsearch';
import logger from '../../configs/logger';

const prefix = process.env.NODE_ENV === 'dev' ? 'dev_' : '';

export const getTrainSearch = async (searchId: string) => {
  const {
    hits: { hits }
  } = await elasticsearch.search({
    index: `${prefix}train_searches`,
    body: {
      query: {
        match: {
          _id: searchId
        }
      }
    }
  });

  if (hits.length > 0) {
    return hits[0]._source;
  }

  return null;
};

export const trackTrainSearch = async (
  searchId: string,
  data: SearchTrackData
): Promise<void> => {
  try {
    if (!elasticsearch) return null;

    const {
      hits: { hits }
    } = await elasticsearch.search({
      index: `visitors`,
      body: {
        query: {
          match: {
            _id: data.visitorId
          }
        }
      }
    });

    const userContext =
      hits.length > 0
        ? hits[0]._source
        : {
            visitorId: data.visitorId,
            country: data.userData.country_code,
            ip: data.userData.ip,
            location: data.userData.location
          };

    elasticsearch.index({
      index: `${prefix}train_searches`,
      id: searchId,
      body: {
        userContext,
        currency: data.currency,
        adults: data.adults,
        children: data.children,
        infants: data.infants,
        cabinClass: data.cabinClass,
        tripType: data.tripType,
        device: data.device,
        source: data.source,
        language: data.language,
        legs: data.legs,
        timestamp: data.timestamp,
        departureDays: data.departureDays,
        status: 'incomplete',
        userId: data.userData._id
      }
    });
  } catch (error) {
    logger.error(error.body);
  }
};

export const trackTrainRedirect = async (
  redirectId: string,
  data: RedirectsTrackData
): Promise<any> => {
  try {
    if (!elasticsearch) return null;

    await elasticsearch.index({
      index: `${prefix}train_redirects`,
      id: redirectId,
      body: data
    });
  } catch (error) {
    logger.error(error.body);
  }
};

export const trackTrainBook = async (
  data: FlightBookTrackData
): Promise<void> => {
  try {
    if (!elasticsearch) return null;

    const {
      hits: { hits }
    } = await elasticsearch.search({
      index: `${prefix}train_bookings`,
      query: {
        match: {
          confirmationCode: data.confirmation
        }
      }
    });

    if (hits.length === 0) {
      const results = await elasticsearch.search({
        index: `${prefix}train_redirects`,
        query: {
          match: {
            _id: data.redirectId
          }
        }
      });

      let redirectData: any = {};

      if (results.hits.hits.length > 0) {
        redirectData = results.hits.hits[0]._source;
      }

      await elasticsearch.index({
        index: `${prefix}train_bookings`,
        body: {
          provider: data.provider,
          redirectId: data.redirectId,
          price: data.price,
          currency: data.currency,
          confirmationCode: data.confirmation,
          timestamps: Date.now(),
          redirect: redirectData
        }
      });
    }
  } catch (error) {
    logger.error(error.body);
  }
};
