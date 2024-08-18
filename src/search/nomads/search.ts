import uuid from 'uuid';
import jwt from 'jsonwebtoken';
import { from, of, defer } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { flightsConvertResultsCurrencies } from '../convert-currencies';
import {
  addAirportsData,
  addAirlinesData,
  addAircraftsData,
  calculateDurations
} from '../add-data';
import { filteringAirports, dividePrice } from '../filtering-airports';
import { checkIsFavorite } from '../check_for_isFavorite';
import { filteringAgents } from '../filtering-agents';
import logger from '../../configs/logger';
import providers from './providers';
import providersIds from './providers-ids';

const { SEARCH_BASE_URL, APP_SECRET } = process.env;

const disabledProviders = process.env.DISABLE_FLIGHT_PROVIDERS
  ? process.env.DISABLE_FLIGHT_PROVIDERS.split(',')
  : [];

const providersKeys = Object.keys(providersIds).filter(
  (id) => disabledProviders.indexOf(providersIds[id]) === -1
);

export const searchNomadInit = async (options: SearchOptions) => {
  const searchId = uuid.v4();

  return {
    searchEndpoints: providersKeys.map(
      (provider) => `${SEARCH_BASE_URL}/searchNomad/${searchId}/${provider}`
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
    map((searchResults) => transformResults(options, searchResults)),
    switchMap((transformedResults: TransformedResult) =>
      filteringAirports(options, transformedResults)
    ),
    switchMap((transformedResults) =>
      checkIsFavorite(options, transformedResults)
    ),
    switchMap((transformedResults) =>
      filteringAgents(options, transformedResults)
    ),
    switchMap((transformedResults: TransformedResult) =>
      dividePrice(options, transformedResults)
    ),
    switchMap((transformedResults: TransformedResult) =>
      flightsConvertResultsCurrencies(options.currency, transformedResults)
    ),
    switchMap((transformedResults: TransformedResult) =>
      addAirportsData(options.language, transformedResults, options.legs)
    ),
    switchMap((transformedResults: TransformedResult) =>
      addAirlinesData(options.language, transformedResults)
    ),
    switchMap((transformedResults: TransformedResult) =>
      addAircraftsData(options.language, transformedResults)
    ),
    map(calculateDurations),
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
    map((searchResults) => transformResults(options, searchResults)),
    switchMap((transformedResults: TransformedResult) =>
      filteringAirports(options, transformedResults)
    ),
    switchMap((transformedResults) =>
      checkIsFavorite(options, transformedResults)
    ),
    switchMap((transformedResults) =>
      filteringAgents(options, transformedResults)
    ),
    switchMap((transformedResults: TransformedResult) =>
      dividePrice(options, transformedResults)
    ),
    switchMap((transformedResults: TransformedResult) =>
      flightsConvertResultsCurrencies(options.currency, transformedResults)
    ),
    switchMap((transformedResults: TransformedResult) =>
      addAirportsData(options.language, transformedResults, options.legs)
    ),
    switchMap((transformedResults: TransformedResult) =>
      addAirlinesData(options.language, transformedResults)
    ),
    switchMap((transformedResults: TransformedResult) =>
      addAircraftsData(options.language, transformedResults)
    ),
    map(calculateDurations),
    catchError((error) => {
      logger.error(error);
      return of(new Error(error));
    })
  );
  return results$.toPromise();
};
