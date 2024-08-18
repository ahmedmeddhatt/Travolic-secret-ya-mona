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
import { SortDataByPrice, SortDataByDuration } from '../SortData';
import { filteringAirports, dividePrice } from '../filtering-airports';
import { checkIsFavorite } from '../check_for_isFavorite';
import { filteringAgents } from '../filtering-agents';
import logger from '../../configs/logger';
import providers from './providers';
import providersIds from './providers-ids';
import { Airport } from '../../models';

const { SEARCH_BASE_URL, APP_SECRET } = process.env;

const disabledProviders = process.env.DISABLE_FLIGHT_PROVIDERS
  ? process.env.DISABLE_FLIGHT_PROVIDERS.split(',')
  : [];

const providersKeys = Object.keys(providersIds).filter(
  (id) => disabledProviders.indexOf(providersIds[id]) === -1
);

export const searchInit = async (options: SearchOptions) => {
  const searchId = uuid.v4();

  return {
    searchEndpoints: providersKeys.map(
      (provider) => `${SEARCH_BASE_URL}/search/${searchId}/${provider}`
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
export const searchInitV2 = async (options: SearchOptions2) => {
  const searchId = uuid.v4();
  const searchEndpoints = [];
  if (options.tripType === 'oneway' || options.tripType === 'round') {
    for (const origin of options.legs[0].origin) {
      for (const destination of options.legs[0].destination) {
        const Leg = [
          {
            origin: origin,
            destination: destination,
            departure: options.legs[0].departure
          }
        ];
        if (options.tripType === 'round') {
          Leg.push({
            origin: destination,
            destination: origin,
            departure: options.legs[1].departure
          });
        }

        const payload = {
          ...options,
          legs: Leg
        };
        const searchUrl = providersKeys.map(
          (provider) => `${SEARCH_BASE_URL}/search/${searchId}/${provider}`
        );
        searchEndpoints.push({ searchUrl, payload });
      }
    }
  } else if (options.tripType === 'multi') {
    const legs = [];
    for (const leg of options.legs) {
      for (const origin of leg.origin) {
        for (const destination of leg.destination) {
          legs.push({
            origin: origin,
            destination: destination,
            departure: leg.departure
          });
        }
      }
    }
    const payload = {
      ...options,
      legs: legs
    };
    const searchUrl = providersKeys.map(
      (provider) => `${SEARCH_BASE_URL}/search/${searchId}/${provider}`
    );
    searchEndpoints.push({ searchUrl, payload });
  }

  return {
    searchEndpoints,
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

const formatTheOptions = (options: SearchOptions): SearchOptions => {
  const swapOrgins = [
    {
      addAlternativeOrigins: options.nearbyAirportOne,
      addAlternativeDestinations: options.nearbyAirportTwo
    },
    {
      addAlternativeDestinations: options.nearbyAirportOne,
      addAlternativeOrigins: options.nearbyAirportTwo
    }
  ];

  let index = 0;
  options.legs.map((leg) => {
    leg.addAlternativeOrigins = swapOrgins[index].addAlternativeOrigins;
    leg.addAlternativeDestinations =
      swapOrgins[index].addAlternativeDestinations;
    index++;
    return leg;
  });

  return options;
};

export const searchProvider = async (
  providerId: string,
  options: SearchOptions,
  ip = '::1'
) => {
  const provider = providers[providersIds[providerId]];

  if (!provider) {
    return {
      error: 'Provider not found'
    };
  }

  if (options.tripType === 'round' || options.tripType === 'oneway') {
    formatTheOptions(options);
    options.legs = await Promise.all(
      options.legs.map(async (leg) => {
        if (leg.addAlternativeOrigins && !leg.orig_city) {
          const airport = await Airport.findOne({ code: leg.origin });
          if (airport) {
            leg.orig_city = !leg.orig_city;
            leg.origin = airport.city.code;
          }
        }
        if (leg.addAlternativeDestinations && !leg.dest_city) {
          const airport = await Airport.findOne({
            code: leg.destination
          });
          if (airport) {
            leg.dest_city = !leg.dest_city;
            leg.destination = airport.city.code;
          }
        }
        return leg;
      })
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
      flightsConvertResultsCurrencies(options.currency, transformedResults, ip)
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
    switchMap((transformedResults: TransformedResult) =>
      SortDataByPrice(options.searchId, transformedResults)
    ),
    map(calculateDurations),
    switchMap((transformedResults: TransformedResult) =>
      SortDataByDuration(options.searchId, transformedResults)
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
  options: SearchOptions,
  ip = '::1'
) => {
  const provider = providers[providerId];

  if (!provider) {
    return {
      error: 'Provider not found'
    };
  }

  if (options.tripType === 'round' || options.tripType === 'oneway') {
    formatTheOptions(options);
    options.legs = await Promise.all(
      options.legs.map(async (leg) => {
        if (leg.addAlternativeOrigins && !leg.orig_city) {
          const airport = await Airport.findOne({ code: leg.origin });
          if (airport) {
            leg.orig_city = !leg.orig_city;
            leg.origin = airport.city.code;
          }
        }
        if (leg.addAlternativeDestinations && !leg.dest_city) {
          const airport = await Airport.findOne({
            code: leg.destination
          });
          if (airport) {
            leg.dest_city = !leg.dest_city;
            leg.destination = airport.city.code;
          }
        }
        return leg;
      })
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
      flightsConvertResultsCurrencies(options.currency, transformedResults, ip)
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
    switchMap((transformedResults: TransformedResult) =>
      SortDataByPrice(options.searchId, transformedResults)
    ),
    map(calculateDurations),
    switchMap((transformedResults: TransformedResult) =>
      SortDataByDuration(options.searchId, transformedResults)
    ),
    catchError((error) => {
      logger.error(error);
      return of(new Error(error));
    })
  );
  return results$.toPromise();
};

export const searchProviderFromCityToCity = async (
  providerId: string,
  options: SearchOptions
) => {
  const provider = providers[providersIds[providerId]];

  if (!provider) {
    return {
      error: 'Provider not found'
    };
  }

  if (options.tripType === 'round' || options.tripType === 'oneway') {
    formatTheOptions(options);
    //if o&d is airport get the city of this airport
    options.legs = await Promise.all(
      options.legs.map(async (leg) => {
        const originAirport = await Airport.findOne({ code: leg.origin });
        leg.orig_city = true;
        if (originAirport) {
          leg.origin = originAirport.city.code;
        }
        const destinationAirport = await Airport.findOne({
          code: leg.destination
        });
        leg.dest_city = true;
        if (destinationAirport) {
          leg.destination = destinationAirport.city.code;
        }
        return leg;
      })
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
    switchMap((transformedResults: TransformedResult) =>
      SortDataByPrice(options.searchId, transformedResults)
    ),
    map(calculateDurations),
    switchMap((transformedResults: TransformedResult) =>
      SortDataByDuration(options.searchId, transformedResults)
    ),
    catchError((error) => {
      logger.error(error);
      return of(new Error(error));
    })
  );
  return results$.toPromise();
};

export const searchProviderWithoutTokenFromCityToCity = async (
  providerId: string,
  options: SearchOptions
) => {
  const provider = providers[providerId];

  if (!provider) {
    return {
      error: 'Provider not found'
    };
  }

  if (options.tripType === 'round' || options.tripType === 'oneway') {
    formatTheOptions(options);
    options.legs = await Promise.all(
      options.legs.map(async (leg) => {
        const originAirport = await Airport.findOne({ code: leg.origin });
        leg.orig_city = true;
        if (originAirport) {
          leg.origin = originAirport.city.code;
        }
        const destinationAirport = await Airport.findOne({
          code: leg.destination
        });
        leg.dest_city = true;
        if (destinationAirport) {
          leg.destination = destinationAirport.city.code;
        }
        return leg;
      })
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
    switchMap((transformedResults: TransformedResult) =>
      SortDataByPrice(options.searchId, transformedResults)
    ),
    map(calculateDurations),
    switchMap((transformedResults: TransformedResult) =>
      SortDataByDuration(options.searchId, transformedResults)
    ),
    catchError((error) => {
      logger.error(error);
      return of(new Error(error));
    })
  );
  return results$.toPromise();
};
