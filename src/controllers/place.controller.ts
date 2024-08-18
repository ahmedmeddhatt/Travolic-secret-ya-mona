import { Request, Response, NextFunction } from 'express';
import TranslationService from '../middlewares/translation';
import { Place } from '../models';
import { languageUtil } from '../utils/get-language.util';
import AppError from '../utils/appError.util';
import elasticClient from '../configs/elasticsearch';
import axios from 'axios';

export const searchFlightPlaces = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { search } = req.query;
  const searchWord = search as string;
  const language = languageUtil(req);
  let places = await Place.searchFlightPlacesPipeline(
    searchWord.toLocaleLowerCase(),
    language as string
  );

  if (places.length === 0) {
    return next(new AppError('No place found', 404));
  }

  places = TranslationService.interceptor(language, places);

  return res.status(200).json(places);
};

export const searchFlightPlacesV2 = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { search } = req.query;
  const searchWord = search as string;
  const language = languageUtil(req);
  let failed = false;
  try {
    const URL = `https://autocomplete.travelpayouts.com/places2?locale=${language}&types[]=airport&types[]=city&term=${searchWord}`;
    const { data } = await axios.get(URL);
    if (data.length === 0) {
      return next(new AppError('No places found', 404));
    }
    const places = data.map((item: any) => {
      return {
        code: item.code,
        name: item.name,
        phrase:
          item.type === 'airport'
            ? `${item.name}, ${item.city_name}, ${item.country_name}`
            : `${item.name}, ${item.country_name}`,
        cityCode: item.type === 'airport' ? item.city_code : item.code,
        countryCode: item.country_code,
        location: {
          type: 'Point',
          coordinates: [item.coordinates.lon, item.coordinates.lat]
        },
        placeType: item.type
      };
    });
    return res.status(200).json(places);
  } catch (error) {
    failed = true;
  }
  if (failed) return next(new AppError('No places found', 404));
};
export const searchFlightPlacesES = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { search } = req.query;
  const searchWord = search as string;
  const language = languageUtil(req);
  const {
    hits: { hits }
  } = await elasticClient.search({
    index: 'places',
    body: {
      query: {
        bool: {
          must: {
            multi_match:
              searchWord.length === 3
                ? {
                    query: searchWord,
                    fields: ['cityCode', 'code']
                  }
                : {
                    query: searchWord,
                    fields: [`phrase.${language}^1`, 'cityCode', 'code'],
                    operator: 'and',
                    type: 'bool_prefix'
                  }
          },
          filter: {
            terms: {
              placeType: ['city', 'airport']
            }
          }
        }
      },
      size: 100
    }
  });

  if (hits.length === 0) {
    return next(new AppError('No places found', 404));
  }

  const places = hits
    .map((item: any) => {
      if (item._source.placeType === 'city' && item._source.airports === 0)
        return null;
      return {
        code: item._source.code,
        name: item._source.name[language],
        phrase: item._source.phrase[language],
        cityCode:
          item._source.placeType === 'airport'
            ? item._source.cityCode
            : item._source.code,
        countryCode: item._source.countryCode,
        location: {
          type: 'Point',
          coordinates: item._source.location
        },
        placeType: item._source.placeType,
        airports: item._source.airports
      };
    })
    .filter((item: any) => item !== null);

  return res.status(200).json(places);
};

export const searchStationPlacesV2 = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { search } = req.query;
  const searchWord = search as string;
  const language = languageUtil(req);
  const {
    hits: { hits }
  } = await elasticClient.search({
    index: 'places',
    body: {
      query: {
        bool: {
          must: {
            multi_match: {
              query: searchWord,
              fields: [`phrase.${language}^1`, 'cityCode^2', 'code^3'],
              operator: 'and',
              type: 'bool_prefix'
            }
          },
          filter: {
            terms: {
              placeType: [
                'city',
                'train_station',
                'bus_station',
                'ferry_station'
              ]
            }
          }
        }
      },
      size: 100
    }
  });

  if (hits.length === 0) {
    return next(new AppError('No places found', 404));
  }

  const places = hits
    .map((item: any) => {
      if (item._source.placeType === 'city' && item._source.stations === 0)
        return null;

      return {
        code: item._source.code,
        name: item._source.name[language],
        phrase: item._source.phrase[language],
        cityCode:
          item._source.placeType === 'city'
            ? item._source.code
            : item._source.cityCode,
        countryCode: item._source.countryCode,
        location: {
          type: 'Point',
          coordinates: item._source.location
        },
        placeType: item._source.placeType
      };
    })
    .filter((item: any) => item !== null);

  return res.status(200).json(places);
};

export const searchStationPlaces = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { search } = req.query;
  const searchWord = search as string;
  const language = languageUtil(req);

  let places = await Place.searchStationPlacesPipeline(
    searchWord.toLocaleLowerCase(),
    language as string
  );

  if (places.length === 0) {
    return next(new AppError('No place found', 404));
  }

  places = TranslationService.interceptor(language, places);

  return res.status(200).json(places);
};

export const searchCityPlaces = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { search } = req.query;
  const searchWord = search as string;
  const language = languageUtil(req);

  let places = await Place.searchCityPlacesPipeline(
    searchWord.toLocaleLowerCase(),
    language as string
  );

  if (places.length === 0) {
    return next(new AppError('No place found', 404));
  }

  places = TranslationService.interceptor(language, places);

  return res.status(200).json(places);
};

export const searchHotelPlaces = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { search } = req.query;
  const searchWord = search as string;
  const language = languageUtil(req);

  let places = await Place.searchHotelPlacesPipeline(
    searchWord.toLocaleLowerCase(),
    language as string
  );

  if (places.length === 0) {
    return next(new AppError('No place found', 404));
  }

  places = TranslationService.interceptor(language, places);

  return res.status(200).json(places);
};
export const searchHotelsPlacesV2 = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { search } = req.query;
  const searchWord = search as string;
  const language = languageUtil(req);
  const {
    hits: { hits }
  } = await elasticClient.search({
    index: 'places',
    body: {
      query: {
        bool: {
          must: {
            multi_match: {
              query: searchWord,
              fields: [`phrase.${language}^1`, 'cityCode^2', 'code^3'],
              operator: 'and',
              type: 'bool_prefix'
            }
          },
          filter: {
            terms: {
              placeType: ['hotels']
            }
          }
        }
      },
      size: 100
    }
  });

  if (hits.length === 0) {
    return next(new AppError('No places found', 404));
  }

  const places = hits
    .map((item: any) => {
      return {
        code: item._source.code,
        name: item._source.name[language],
        phrase: item._source.phrase[language],
        cityCode: item._source.cityCode,
        countryCode: item._source.countryCode,
        location: {
          type: 'Point',
          coordinates: item._source.location
        },
        placeType: item._source.placeType
      };
    })
    .filter((item: any) => item !== null);

  return res.status(200).json(places);
};
