import moment from 'moment';
import elasticsearch from '../../configs/elasticsearch';
import logger from '../../configs/logger';

const prefix = process.env.NODE_ENV === 'dev' ? 'dev_' : '';

export const getFlightSearch = async (searchId: string) => {
  const {
    hits: { hits }
  } = await elasticsearch.search({
    index: `${prefix}flight_searches`,
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

export const trackFlightSearch = async (
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
      index: `${prefix}flight_searches`,
      id: searchId,
      body: {
        userContext,
        currency: data.currency,
        adults: data.adults,
        children: data.children,
        language: data.language,
        infants: data.infants,
        cabinClass: data.cabinClass,
        tripType: data.tripType,
        legs: data.legs,
        isDomestic: data.isDomestic,
        device: data.device,
        source: data.source,
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
export const trackFlightSearchV2 = async (
  searchId: string,
  data
): Promise<void> => {
  for (const item of data) {
    try {
      if (!elasticsearch) return null;

      const {
        hits: { hits }
      } = await elasticsearch.search({
        index: `visitors`,
        body: {
          query: {
            match: {
              _id: item.visitorId
            }
          }
        }
      });

      const userContext =
        hits.length > 0
          ? hits[0]._source
          : {
              visitorId: item.visitorId,
              country: item.userData.country_code,
              ip: item.userData.ip,
              location: item.userData.location
            };

      await elasticsearch.index({
        index: `${prefix}flight_searches`,
        id: searchId,
        body: {
          userContext,
          currency: item.currency,
          adults: item.adults,
          children: item.children,
          language: item.language,
          infants: item.infants,
          cabinClass: item.cabinClass,
          tripType: item.tripType,
          legs: item.legs,
          isDomestic: item.isDomestic,
          device: item.device,
          source: item.source,
          timestamp: item.timestamp,
          departureDays: item.departureDays,
          status: 'incomplete',
          userId: item.userData._id
        }
      });
    } catch (error) {
      logger.error(error.body);
    }
  }
};

export const trackFlightRedirect = async (
  redirectId: string,
  data: RedirectsTrackData
): Promise<any> => {
  try {
    if (!elasticsearch) return null;
    await elasticsearch.index({
      index: `${prefix}flight_redirects`,
      id: redirectId,
      body: data
    });
  } catch (error) {
    logger.error(error.body);
  }
};

export const trackFlightBook = async (
  data: FlightBookTrackData
): Promise<void> => {
  try {
    if (!elasticsearch) return null;

    const {
      hits: { hits }
    } = await elasticsearch.search({
      index: `${prefix}flight_bookings`,
      query: {
        match: {
          confirmationCode: data.confirmation
        }
      }
    });

    if (hits.length === 0) {
      const results = await elasticsearch.search({
        index: `${prefix}flight_redirects`,
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
        index: `${prefix}flight_bookings`,
        body: {
          redirectId: data.redirectId,
          provider: data.provider,
          price: data.price,
          currency: data.currency,
          confirmationCode: data.confirmation,
          timestamp: Date.now(),
          redirect: redirectData
        }
      });
    }
  } catch (error) {
    logger.error(error.body);
  }
};

export const updateFlightSearch = async (
  searchId: string,
  status: string,
  prices: searchFlightPriceFilters
): Promise<void> => {
  try {
    if (!elasticsearch) return null;
    await elasticsearch.updateByQuery({
      index: `${prefix}flight_searches`,
      body: {
        script: {
          source: `ctx._source.prices = params.prices;
                  ctx._source.status = params.status;
                  ctx._source.completedAt = params.timestamp;`,
          lang: 'painless',
          params: {
            prices,
            status,
            timestamp: moment.utc().format()
          }
        }
      },
      query: {
        terms: {
          _id: [searchId]
        }
      }
    });
  } catch (error) {
    logger.error(error.body);
  }
};

export const trackFlight90Search = async (
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
      index: `${prefix}flight90_searches`,
      id: searchId,
      body: {
        userContext,
        currency: data.currency,
        adults: data.adults,
        children: data.children,
        language: data.language,
        infants: data.infants,
        cabinClass: data.cabinClass,
        tripType: data.tripType,
        legs: data.legs,
        isDomestic: data.isDomestic,
        device: data.device,
        timestamp: data.timestamp,
        departureDays: data.departureDays,
        userId: data.userData._id
      }
    });
  } catch (error) {
    logger.error(error.body);
  }
};
