import moment from 'moment';
import { trackTrainSearch } from './track';
import elasticClient from '../../configs/elasticsearch';

export const trainSearchTracking = async (
  searchId: string,
  options: TrainsTrackingSearchOptions
) => {
  const legs = await Promise.all(
    options.legs.map(async (leg) => {
      const legObj = {
        departure: leg.departure
      };

      const [
        {
          hits: {
            hits: [origin]
          }
        },
        {
          hits: {
            hits: [destination]
          }
        }
      ]: [any, any] = await Promise.all([
        elasticClient.search({
          index: 'places',
          body: {
            query: {
              bool: {
                must: [
                  {
                    term: {
                      'code.keyword': leg.origin
                    }
                  },
                  {
                    term: {
                      placeType: leg.originPlaceType
                    }
                  }
                ]
              }
            },
            size: 1
          }
        }),
        elasticClient.search({
          index: 'places',
          body: {
            query: {
              bool: {
                must: [
                  {
                    term: {
                      'code.keyword': leg.destination
                    }
                  },
                  {
                    term: {
                      placeType: leg.destinationPlaceType
                    }
                  }
                ]
              }
            },
            size: 1
          }
        })
      ]);

      if (origin) {
        legObj['origin'] = origin._source.code;
        legObj['originLocation'] = origin._source.location;
        legObj['originCountryCode'] = origin._source.countryCode;
        legObj['isOriginCity'] = origin._source.placeType === 'city';

        if (origin._source.placeType === 'city') {
          legObj['originCityCode'] = origin._source.code;
        } else {
          legObj['originStationCode'] = origin.code;
          legObj['originCityCode'] = origin._source.cityCode;
        }
      } else {
        legObj['origin'] = leg.origin;
      }

      if (destination) {
        legObj['destination'] = destination._source.code;
        legObj['destinationLocation'] = destination._source.location;
        legObj['destinationCountryCode'] = destination._source.countryCode;
        legObj['isDestinationCity'] = destination._source.placeType === 'city';

        if (destination._source.placeType === 'city') {
          legObj['destinationCityCode'] = destination._source.code;
        } else {
          legObj['destinationStationCode'] = destination._source.code;
          legObj['destinationCityCode'] = destination._source.cityCode;
        }
      } else {
        legObj['destination'] = leg.destination;
      }

      return legObj;
    })
  );

  const trackData = {
    legs,
    timestamp: moment.utc().format(),
    source: options.source,
    userData: options.userData,
    device: {
      os: options.deviceInfo,
      type: options.deviceType,
      platform: options.devicePlatform,
      platformName: options.devicePlatformName,
      version: options.deviceVersion
    },
    visitorId: options.visitorId,
    currency: options.currency,
    cabinClass: options.cabinClass,
    adults: options.adults,
    children: options.children,
    infants: options.infants,
    tripType: options.tripType,
    country: options.country,
    language: options.language,
    departureDays: moment(
      moment(options.legs[0].departure).format('YYYY-MM-DD')
    ).diff(moment().format('YYYY-MM-DD'), 'days')
  };

  trackTrainSearch(searchId, trackData);
};
