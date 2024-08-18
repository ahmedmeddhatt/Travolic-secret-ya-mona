import moment from 'moment';
import {
  trackFlightSearch,
  trackFlight90Search,
  trackFlightSearchV2
} from './track';
import elasticClient from '../../configs/elasticsearch';

export const flightSearchTracking = async (
  searchId: string,
  options: FlightsTrackingSearchOptions
) => {
  const legs = await Promise.all(
    options.legs.map(async (leg) => {
      const legObj: any = {
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
                      placeType: leg.orig_city ? 'city' : 'airport'
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
                      placeType: leg.dest_city ? 'city' : 'airport'
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
          legObj['originAirportCode'] = origin._source.code;
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
          legObj['destinationAirportCode'] = destination._source.code;
          legObj['destinationCityCode'] = destination._source.cityCode;
        }
      } else {
        legObj['destination'] = leg.destination;
      }

      if (
        legObj['destinationCountryCode'] &&
        legObj['originCountryCode'] &&
        legObj['destinationCountryCode'] === legObj['originCountryCode']
      ) {
        legObj['isDomestic'] = true;
      } else {
        legObj['isDomestic'] = false;
      }

      return legObj;
    })
  );

  const trackData = {
    legs,
    isDomestic: options.tripType !== 'multi' ? legs[0].isDomestic : undefined,
    userData: options.userData,
    device: {
      os: options.deviceInfo,
      type: options.deviceType,
      platform: options.devicePlatform,
      platformName: options.devicePlatformName,
      version: options.deviceVersion
    },
    source: options.source,
    timestamp: moment.utc().format(),
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

  trackFlightSearch(searchId, trackData);
};
export const flightSearchTracking2 = async (
  searchId: string,
  payloadsResults
) => {
  const data = payloadsResults;
  const trackingResults = [];
  for (const item of data.payloadsResults) {
    const legs = await Promise.all(
      item.legs.map(async (leg) => {
        const legObj: any = {
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
                        placeType: leg.orig_city ? 'city' : 'airport'
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
                        placeType: leg.dest_city ? 'city' : 'airport'
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
            legObj['originAirportCode'] = origin._source.code;
            legObj['originCityCode'] = origin._source.cityCode;
          }
        } else {
          legObj['origin'] = leg.origin;
        }

        if (destination) {
          legObj['destination'] = destination._source.code;
          legObj['destinationLocation'] = destination._source.location;
          legObj['destinationCountryCode'] = destination._source.countryCode;
          legObj['isDestinationCity'] =
            destination._source.placeType === 'city';
          if (destination._source.placeType === 'city') {
            legObj['destinationCityCode'] = destination._source.code;
          } else {
            legObj['destinationAirportCode'] = destination._source.code;
            legObj['destinationCityCode'] = destination._source.cityCode;
          }
        } else {
          legObj['destination'] = leg.destination;
        }

        if (
          legObj['destinationCountryCode'] &&
          legObj['originCountryCode'] &&
          legObj['destinationCountryCode'] === legObj['originCountryCode']
        ) {
          legObj['isDomestic'] = true;
        } else {
          legObj['isDomestic'] = false;
        }

        return legObj;
      })
    );
    const trackData = {
      legs,
      userData: item.userData,
      isDomestic: item.tripType !== 'multi' ? legs[0].isDomestic : undefined,
      device: {
        os: data.deviceInfo,
        type: data.deviceType,
        platform: data.devicePlatform,
        platformName: data.devicePlatformName,
        version: data.deviceVersion
      },
      source: data.source,
      timestamp: moment.utc().format(),
      visitorId: item.visitorId,
      currency: item.currency,
      cabinClass: item.cabinClass,
      adults: item.adults,
      children: item.children,
      infants: item.infants,
      tripType: item.tripType,
      country: item.country,
      language: item.language,
      departureDays: moment(
        moment(item.legs[0].departure).format('YYYY-MM-DD')
      ).diff(moment().format('YYYY-MM-DD'), 'days')
    };
    trackingResults.push(trackData);
  }
  trackFlightSearchV2(searchId, trackingResults);
};

export const flight90SearchTracking = async (
  searchId: string,
  options: FlightsTrackingSearchOptions
) => {
  const legs = await Promise.all(
    options.legs.map(async (leg) => {
      const legObj: any = {
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
                      placeType: leg.orig_city ? 'city' : 'airport'
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
                      placeType: leg.dest_city ? 'city' : 'airport'
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
          legObj['originAirportCode'] = origin._source.code;
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
          legObj['destinationAirportCode'] = destination._source.code;
          legObj['destinationCityCode'] = destination._source.cityCode;
        }
      } else {
        legObj['destination'] = leg.destination;
      }

      if (
        legObj['destinationCountryCode'] &&
        legObj['originCountryCode'] &&
        legObj['destinationCountryCode'] === legObj['originCountryCode']
      ) {
        legObj['isDomestic'] = true;
      } else {
        legObj['isDomestic'] = false;
      }

      return legObj;
    })
  );

  const trackData = {
    legs,
    isDomestic: options.tripType !== 'multi' ? legs[0].isDomestic : undefined,
    source: options.source,
    userData: options.userData,
    device: {
      os: options.deviceInfo,
      type: options.deviceType,
      platform: options.devicePlatform,
      platformName: options.devicePlatformName,
      version: options.deviceVersion
    },
    timestamp: moment.utc().format(),
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

  trackFlight90Search(searchId, trackData);
};
