import uuid from 'uuid';
import jwt from 'jsonwebtoken';
import { from, of, defer } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import logger from '../../configs/logger';
import providersIds from './providers-ids';

import providers from './providers';
// import { convertResultsCurrencies } from '../convert-currencies';
import { City, Country } from '../../models';
import { HotelProd } from '../../models';

const { SEARCH_BASE_URL, APP_SECRET, DISABLE_HOTELS_PROVIDERS } = process.env;

const disabledProviders = DISABLE_HOTELS_PROVIDERS
  ? DISABLE_HOTELS_PROVIDERS.split(',')
  : [];
const providersKeys = Object.keys(providersIds).filter(
  (id) => disabledProviders.indexOf(providersIds[id]) === -1
);

export const searchHotelInit = async (options: SearchHotelOptions) => {
  const searchId = uuid.v4();

  return {
    searchEndpoints: providersKeys.map(
      (provider) => `${SEARCH_BASE_URL}/searchHotel/${searchId}/${provider}`
    ),
    searchId,
    visitorId: options.visitorId,
    token: jwt.sign(
      {
        visitorId: options.visitorId,
        date: new Date()
      },
      APP_SECRET
    )
  };
};

export const searchProvider = async (
  providerId: string,
  options: SearchHotelOptions
) => {
  const providerName = providersIds[providerId];
  const provider = providers[providerName];

  if (!provider) {
    return {
      error: 'Provider not found'
    };
  }
  // if (options.isCity === true) {
  //   const city = await City.findOne({
  //     giata_city_id: options.cityId
  //   });
  //   options.cityId = JSON.parse(JSON.stringify(city));
  // } else {
  //   const hotel = await Hotel.findOne({
  //     giataId: options.hotelId
  //   });

  //   options.hotelId = JSON.parse(JSON.stringify(hotel));
  // }

  if (options.type == 'hotels') {
    const hotels = await HotelProd.find({
      giataId: { $in: options.idList },
      [`providerCodes.${providerName}`]: {
        $exists: true,
        $type: 'array',
        $not: { $size: 0 }
      }
    });
    options.hotelsData = hotels.map((hotel) =>
      JSON.parse(JSON.stringify(hotel))
    );
  } else if (options.type == 'cities') {
    let cities = await City.find({
      giata_city_id: { $in: options.idList }
    });

    cities = cities.map((city) => city.id);

    const hotels = await HotelProd.find({
      city: { $in: cities },
      [`providerCodes.${providerName}`]: {
        $exists: true,
        $type: 'array',
        $not: { $size: 0 }
      }
    });

    options.hotelsData = hotels.map((hotel) =>
      JSON.parse(JSON.stringify(hotel))
    );
  } else if (options.type == 'country') {
    const country = await Country.findOne({
      code: options.idList[0]
    });

    let cities = await City.find({
      country: country._id
    });

    cities = cities.map((city) => city.id);

    const hotels = await HotelProd.find({
      city: { $in: cities },
      [`providerCodes.${providerName}`]: {
        $exists: true,
        $type: 'array',
        $not: { $size: 0 }
      }
    });
    options.hotelsData = hotels.map((hotel) =>
      JSON.parse(JSON.stringify(hotel))
    );
  }

  const { search, transformResults, interceptor } = provider;
  const results$ = from(search(options)).pipe(
    switchMap((searchResults) =>
      defer(() => {
        if (interceptor) {
          return interceptor(options, searchResults);
        } else {
          return of(searchResults);
        }
      })
    ),
    switchMap(async (searchResults) =>
      transformResults(options, searchResults)
    ),
    // switchMap((transformedResults: TransformedHotelResult) =>
    //   convertResultsCurrencies(options.currency, transformedResults)
    // ),

    catchError((error) => {
      logger.error(error);
      return of(new Error(error));
    })
  );
  return results$.toPromise();
};

export const searchProviderWithoutToken = async (
  providerId: string,
  options: SearchHotelOptions
) => {
  const provider = providers[providerId];

  if (!provider) {
    return {
      error: 'Provider not found'
    };
  }
  // if (options.isCity === true) {
  //   const city = await City.findOne({
  //     giata_city_id: options.cityId
  //   });
  //   options.cityId = JSON.parse(JSON.stringify(city));
  // } else {
  //   const hotel = await Hotel.findOne({
  //     giataId: options.hotelId
  //   });

  //   options.hotelId = JSON.parse(JSON.stringify(hotel));
  // }

  if (options.type == 'hotels') {
    const hotels = await HotelProd.find({
      giataId: { $in: options.idList },
      [`providerCodes.${providerId}`]: {
        $exists: true,
        $type: 'array',
        $not: { $size: 0 }
      }
    });
    options.hotelsData = hotels.map((hotel) =>
      JSON.parse(JSON.stringify(hotel))
    );
  } else if (options.type == 'cities') {
    options.idList = options.idList.slice(0, 5).map((id) => `${id}`);

    let cities = await City.find({
      giata_city_id: { $in: options.idList }
    });

    cities = cities.map((city) => city.id);

    const hotels = await HotelProd.find({
      city: { $in: cities },
      [`providerCodes.${providerId}`]: {
        $exists: true,
        $type: 'array',
        $not: { $size: 0 }
      }
    });

    options.hotelsData = hotels.map((hotel) =>
      JSON.parse(JSON.stringify(hotel))
    );
  } else if (options.type == 'country') {
    const country = await Country.findOne({
      code: options.idList[0]
    });

    let cities = await City.find({
      country: country._id
    });

    cities = cities.map((city) => city.id);

    const hotels = await HotelProd.find({
      city: { $in: cities },
      [`providerCodes.${providerId}`]: {
        $exists: true,
        $type: 'array',
        $not: { $size: 0 }
      }
    });
    options.hotelsData = hotels.map((hotel) =>
      JSON.parse(JSON.stringify(hotel))
    );
  }

  const { search, transformResults, interceptor } = provider;

  const results$ = from(search(options)).pipe(
    switchMap((searchResults) =>
      defer(() => {
        if (interceptor) {
          return interceptor(options, searchResults);
        } else {
          return of(searchResults);
        }
      })
    ),
    switchMap(async (searchResults) =>
      transformResults(options, searchResults)
    ),
    catchError((error) => {
      logger.error(error);
      return of(new Error(error));
    })
  );
  return results$.toPromise();
};
