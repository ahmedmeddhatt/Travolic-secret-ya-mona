import TranslationService from '../middlewares/translation';
import { Airport, MetropolitanArea } from '../models';
import getIPData from '../utils/ipData.util';
import elasticCient from '../configs/elasticsearch';
import logger from '../configs/logger';

export const searchAirportsService = async (
  code: string,
  language: string
): Promise<any> => {
  let airports = await Airport.find({
    $or: [
      { code: code },
      {
        [`name.${language}`]: {
          $regex: '.*' + code + '.*',
          $options: 'i'
        }
      }
    ]
  });

  if (airports.length === 0) {
    return {
      status: 'Error',
      code: 404,
      message: 'No airports found'
    };
  }

  airports = TranslationService.interceptor(language, airports);

  const metropolitanAreas = await MetropolitanArea.find({
    $or: [
      { code: code },
      {
        [`name.${language}`]: {
          $regex: '.*' + code + '.*',
          $options: 'i'
        }
      }
    ]
  }).populate({
    path: 'city',
    populate: { path: 'country' }
  });

  if (metropolitanAreas.length === 0) {
    return {
      status: 'Error',
      code: '404',
      message: 'No metropolitan areas found'
    };
  }

  return [...airports, ...metropolitanAreas];
};

export const getAirportService = async (
  code: string,
  language: string
): Promise<any> => {
  let airport = await Airport.findOne({ code });

  if (!airport) {
    return {
      status: 'Error',
      code: 404,
      message: 'No airport found'
    };
  }

  airport = TranslationService.translate(airport, language);

  if (airport.city.image) {
    airport.city.url = `${process.env.GCLOUD_STORAGE_PUBLIC_URL}/${process.env.GCLOUD_STORAGE_BUCKET}/${airport.city.image.pathWithFilename}`;
  } else {
    airport.city.url = `${process.env.GCLOUD_STORAGE_PUBLIC_URL}/${process.env.GCLOUD_STORAGE_BUCKET}/default_trending.jpeg`;
  }

  return airport;
};

export const getAirportsService = async (
  page: number,
  limit: number,
  language: string
): Promise<any> => {
  const airports = await Airport.paginate(
    {},
    {
      page,
      limit
    }
  );

  airports.docs = TranslationService.interceptor(language, airports.docs);

  return airports;
};

export const nearByService = async (
  ip: string,
  params: any,
  language: string
): Promise<any> => {
  const { country_code, location } = await getIPData(ip, 'server');
  let radius = 50;
  let places: any[] = [];
  const maxRadius = 200;

  while (radius <= maxRadius && places.length === 0) {
    try {
      const searchResult = await elasticCient.search({
        index: 'places',
        body: {
          query: {
            bool: {
              filter: [
                {
                  bool: {
                    should: [
                      {
                        match: {
                          placeType: 'airport'
                        }
                      },
                      {
                        bool: {
                          must: [
                            {
                              match: {
                                placeType: 'city'
                              }
                            },
                            {
                              range: {
                                airports: {
                                  gt: 0
                                }
                              }
                            }
                          ]
                        }
                      }
                    ]
                  }
                },
                {
                  match: {
                    countryCode: country_code
                  }
                },
                {
                  geo_distance: {
                    distance: `${radius}km`,
                    location: {
                      lat: location[1],
                      lon: location[0]
                    }
                  }
                }
              ]
            }
          },
          sort: [
            {
              _geo_distance: {
                location: {
                  lat: location[1],
                  lon: location[0]
                },
                order: 'asc',
                unit: 'km'
              }
            }
          ],
          size: 100
        }
      });

      places = searchResult.hits.hits;
    } catch (error) {
      if (
        error.meta &&
        error.meta.body &&
        error.meta.body.error.type === 'index_closed_exception'
      ) {
        return {
          status: 'Error',
          code: 500
        };
      } else {
        logger.error('An error occurred:', error);

        return {
          code: 500,
          message: 'An unexpected error occurred.'
        };
      }
    }

    if (places.length === 0) {
      radius += 50;
    }
  }

  if (places.length === 0) {
    return {
      status: 'Error',
      code: 404,
      message: 'No places found!'
    };
  }

  places = places.map((place: any) => {
    return {
      ...place._source,
      name: place._source.name[language],
      phrase: place._source.phrase[language],
      location: {
        type: 'Point',
        coordinates: place._source.location
      },
      distance: place.sort[0].toFixed(2),
      unit: 'km'
    };
  });

  return places;
};
