import uuid from 'uuid';
import jwt from 'jsonwebtoken';
import { from, of, defer } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { trainsConvertResultsCurrencies } from '../convert-currencies';
import { calculateStationDurations } from '../add-data';
import { City, Station } from '../../models';
import TranslationService from '../../middlewares/translation';
import logger from '../../configs/logger';
import providersIds from './providers-ids';
import providers from './providers';

const { SEARCH_BASE_URL, APP_SECRET, DISABLE_TRAIN_PROVIDERS } = process.env;

const disabledProviders = DISABLE_TRAIN_PROVIDERS
  ? DISABLE_TRAIN_PROVIDERS.split(',')
  : [];

const providersKeys = Object.keys(providersIds).filter(
  (id) => disabledProviders.indexOf(providersIds[id]) === -1
);

export const searchTrainInit = async (options: SearchOptions) => {
  const searchId = uuid.v4();

  return {
    searchEndpoints: providersKeys.map(
      (provider) => `${SEARCH_BASE_URL}/searchTrain/${searchId}/${provider}`
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
  options: SearchOptions
) => {
  const provider = providers[providersIds[providerId]];

  if (!provider) {
    return {
      error: 'Provider not found'
    };
  }

  const { search, transformResults, interceptor } =
    providers[providersIds[providerId]];

  if (options.legs[0].originPlaceType === 'city') {
    const city = await City.findOne({
      code: options.legs[0].origin
    });
    options.origin = JSON.parse(JSON.stringify(city));
  } else {
    const station = await Station.findOne({
      code: options.legs[0].origin,
      type: options.legs[0].originPlaceType
    });

    options.origin = JSON.parse(JSON.stringify(station));
  }

  if (options.legs[0].destinationPlaceType === 'city') {
    const city = await City.findOne({
      code: options.legs[0].destination
    });

    options.destination = JSON.parse(JSON.stringify(city));
  } else {
    const station = await Station.findOne({
      code: options.legs[0].destination,
      type: options.legs[0].destinationPlaceType
    });

    options.destination = JSON.parse(JSON.stringify(station));
  }

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

    switchMap((searchResults) => transformResults(options, searchResults)),
    switchMap((transformedResults: TransformedTrainResult) =>
      trainsConvertResultsCurrencies(options.currency, transformedResults)
    ),
    switchMap((transformedResults: TransformedTrainResult) =>
      calculateStationDurations(transformedResults)
    ),
    catchError((error) => {
      logger.error(error);
      return of(new Error(error));
    })
  );

  return results$.toPromise();
};

export const searchProviderWithoutToken = async (
  providerId: string,
  options: SearchOptions
) => {
  const provider = providers[providerId];

  if (!provider) {
    return {
      error: 'Provider not found'
    };
  }

  const { search, transformResults, interceptor } = provider;

  if (options.legs[0].originPlaceType === 'city') {
    let city = await City.findOne({
      code: options.legs[0].origin
    });

    city = TranslationService.translate(city, options.language);
    options.origin = JSON.parse(JSON.stringify(city));
  } else {
    let station = await Station.findOne({
      code: options.legs[0].origin,
      type: options.legs[0].originPlaceType
    });

    station = TranslationService.translate(station, options.language);
    options.origin = JSON.parse(JSON.stringify(station));
  }

  if (options.legs[0].destinationPlaceType === 'city') {
    let city = await City.findOne({
      code: options.legs[0].destination
    });

    city = TranslationService.translate(city, options.language);
    options.destination = JSON.parse(JSON.stringify(city));
  } else {
    let station = await Station.findOne({
      code: options.legs[0].destination,
      type: options.legs[0].destinationPlaceType
    });

    station = TranslationService.translate(station, options.language);
    options.destination = JSON.parse(JSON.stringify(station));
  }

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
    switchMap((searchResults) => transformResults(options, searchResults)),
    switchMap((transformedResults: TransformedTrainResult) =>
      trainsConvertResultsCurrencies(options.currency, transformedResults)
    ),
    switchMap((transformedResults: TransformedTrainResult) =>
      calculateStationDurations(transformedResults)
    ),
    catchError((error) => {
      logger.error(error);
      return of(new Error(error));
    })
  );

  return results$.toPromise();
};
