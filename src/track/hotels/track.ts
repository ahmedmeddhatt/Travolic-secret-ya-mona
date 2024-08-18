import moment from 'moment';
import elasticsearch from '../../configs/elasticsearch';
import logger from '../../configs/logger';

const prefix = process.env.NODE_ENV === 'dev' ? 'dev_' : '';

export const getHotelSearch = async (searchId: string) => {
  const {
    hits: { hits }
  } = await elasticsearch.search({
    index: `${prefix}hotel_searches`,
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

export const trackHotelSearch = async (
  searchId: string,
  data: HotelSearchTrackData
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
      index: `${prefix}hotel_searches`,
      id: searchId,
      body: {
        userContext,
        currency: data.currency,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        roomsCount: data.roomsCount ?? undefined,
        nightsCount: data.nightsCount ?? undefined,
        isCity: data.isCity ?? undefined,
        cityCode: data.cityCode ?? undefined,
        cityId: data.cityId ?? undefined,
        countryCode: data.countryCode ?? undefined,
        country: data.country ?? undefined,
        hotelId: data.hotelId ?? undefined,
        hotelName: data.hotelName ?? undefined,
        guests: {
          adults: data.guests.adults,
          children: data.guests.children,
          infants: data.guests.infants ?? undefined
        },
        language: data.language ?? undefined,
        device: data.device,
        source: data.source,
        timestamp: data.timestamp,
        status: 'incomplete',
        userId: data.userData._id
      }
    });
  } catch (error) {
    logger.error(error.body);
  }
};

export const trackHotelSearchV2 = async (
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
        index: `${prefix}hotel_searches`,
        id: searchId,
        body: {
          userContext,
          currency: data.currency,
          checkIn: data.checkIn,
          checkOut: data.checkOut,
          roomsCount: data.roomsCount,
          nightsCount: data.nightsCount,
          isCity: data.isCity,
          cityCode: data.cityCode,
          cityId: data.cityId,
          countryCode: data.country,
          hotelId: data.hotelId,
          hotelName: data.hotelName,
          guests: {
            adults: data.guests.adults,
            children: data.guests.children,
            infants: data.guests.infants
          },
          language: data.language,
          device: data.device,
          source: data.source,
          timestamp: data.timestamp,
          status: 'incomplete',
          userId: data.userData._id
        }
      });
    } catch (error) {
      logger.error(error.body);
    }
  }
};

export const trackHotelRedirect = async (
  redirectId: string,
  data: HotelRedirectsTrackData
): Promise<any> => {
  try {
    if (!elasticsearch) return null;
    await elasticsearch.index({
      index: `${prefix}hotel_redirects`,
      id: redirectId,
      body: data
    });
  } catch (error) {
    logger.error(error.body);
  }
};

export const trackHotelBook = async (
  data: HotelBookTrackData
): Promise<void> => {
  try {
    if (!elasticsearch) return null;

    const {
      hits: { hits }
    } = await elasticsearch.search({
      index: `${prefix}hotel_bookings`,
      query: {
        match: {
          confirmationCode: data.confirmation
        }
      }
    });

    if (hits.length === 0) {
      const results = await elasticsearch.search({
        index: `${prefix}hotel_redirects`,
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
        index: `${prefix}hotel_bookings`,
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

export const updateHotelSearch = async (
  searchId: string,
  status: string,
  prices: searchHotelPriceFilters
): Promise<void> => {
  try {
    if (!elasticsearch) return null;
    await elasticsearch.updateByQuery({
      index: `${prefix}hotel_searches`,
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
