import { from, of } from 'rxjs';
import uuid from 'uuid';
import { sign } from 'jsonwebtoken';
import { switchMap, map, catchError } from 'rxjs/operators';
import { flightsConvertResultsCurrencies } from '../convert-currencies';
import logger from '../../configs/logger';
import providers from './providers';

const { SEARCH_BASE_URL, APP_SECRET, DISABLE_TRANSFER_PROVIDERS } = process.env;

const disabledTransferProviders = DISABLE_TRANSFER_PROVIDERS
  ? DISABLE_TRANSFER_PROVIDERS.split(',')
  : [];

export const searchTransferInit = async (options: SearchOptions) => {
  const searchId = uuid.v4();
  const providersKeys = Object.keys(providers).filter(
    (provider) => disabledTransferProviders.indexOf(provider) === -1
  );

  const payload = {
    visitorId: options.visitorId,
    date: new Date()
  };

  const token = sign(payload, APP_SECRET);

  return {
    searchEndpoints: providersKeys.map(
      (provider) => `${SEARCH_BASE_URL}/searchTransfer/${searchId}/${provider}`
    ),
    searchId,
    visitorId: options.visitorId,
    token
  };
};

export const searchProvider = async (
  provider: string,
  options: SearchTransfersOptions
) => {
  const { search, transformResults } = providers[provider];

  const results$ = from(search(options)).pipe(
    map((searchResults) => transformResults(options, searchResults)),
    switchMap((transformedResults) =>
      flightsConvertResultsCurrencies(options.currency, transformedResults)
    ),
    catchError((error) => {
      logger.error(error);
      return of({ error: error.message });
    })
  );
  return results$.toPromise();
};
