// import uuid from 'uuid';
// import moment from 'moment';
// import { from, of, Observable } from 'rxjs';
// import {
//   map,
//   scan,
//   mergeMap,
//   catchError,
//   endWith,
//   switchMap,
//   share,
//   concatMap
// } from 'rxjs/operators';
// import * as cache from '../../utils/cache.util';
// import providers from './providers';
// import { createFunctionArgsSignature, parseError } from '../../utils';
// import { addHotelsData } from '../add-data';

// const getReqesetResults = async (
//   searchId: string
// ): Promise<CollectedHotelResults> => {
//   const cachedData = await cache.getJSON(`search-results-${searchId}`);
//   return cachedData as CollectedHotelResults;
// };

// const setReqesetResults = (
//   searchId: string,
//   results: CollectedHotelResults
// ) => {
//   return cache.setJSON(`search-results-${searchId}`, results, {
//     duration: moment.duration({
//       minutes: 8
//     })
//   });
// };

// const initialRequest = {
//   providers: [],
//   agents: {},
//   data: {},
//   hotels: {},
//   chains: {},
//   brands: {},
//   completed: false
// };

// const createInitialRequest = (
//   searchId: string,
//   options: SearchHotelOptions
// ): CollectedHotelResults => {
//   return {
//     timestamp: moment.utc().format(),
//     requestId: searchId,
//     options,
//     providers: [],
//     data: {},
//     hotels: {},
//     chains: {},
//     brands: {},
//     agents: {},
//     completed: false,
//     lastUpdateted: Date.now(),
//     errors: {}
//   };
// };

// const mergeResults = (source, target): CollectedHotelResults => {
//   return {
//     ...source,
//     errors: {
//       ...source.errors,
//       ...(target.error
//         ? {
//             [target.provider]: target.error
//           }
//         : {})
//     },
//     providers: [
//       ...source.providers,
//       ...(target.completed ? [target.provider] : [])
//     ],
//     agents: { ...source.agents, ...target.agents },
//     data: { ...source.data, ...target.data },
//     hotels: { ...source.hotels, ...target.hotels },
//     chains: { ...source.chains, ...target.chains },
//     brands: { ...source.brands, ...target.brands },
//     lastUpdateted: Date.now(),
//     completed: false
//   };
// };

// const search$ = (
//   options: SearchHotelOptions,
//   name: string
// ): Observable<any> => {
//   const provider = providers[name];

//   return from(provider.search(options)).pipe(
//     map((result) => {
//       const transformedResults = provider.transformResults(options, result);
//       return {
//         provider: name,
//         completed: false,
//         ...transformedResults
//       };
//     })
//   );
// };

// const runSearches = (searchId: string, options: SearchHotelOptions) => {
//   const providersKeys = Object.keys(providers);
//   const searchResults$ = from(providersKeys).pipe(
//     mergeMap((name) => {
//       return search$(options, name).pipe(
//         // mergeMap((result) =>
//         //   flightsConvertResultsCurrencies(
//         //     options.currency,
//         //     result as TransformedHotelResult
//         //   )
//         // ),
//         mergeMap((result) =>
//           addHotelsData(searchId, result as TransformedHotelResult)
//         ),
//         map((results) => ({ ...results, provider: name })),
//         endWith({
//           completed: true,
//           provider: name
//         }),
//         catchError((error: Error) => {
//           return of({
//             ...initialRequest,
//             timestamp: '',
//             requestId: searchId,
//             options,
//             lastUpdateted: Date.now(),
//             completed: true,
//             provider: name,
//             error: parseError(error)
//           });
//         })
//       );
//     }),
//     scan(mergeResults, createInitialRequest(searchId, options)),
//     map((results) => {
//       if (results.providers.length === providersKeys.length) {
//         return {
//           ...results,
//           completed: true
//         };
//       }

//       return results;
//     }),
//     catchError((error) => {
//       return of({
//         ...initialRequest,
//         timestamp: Date.now(),
//         requestId: searchId,
//         options,
//         lastUpdateted: Date.now(),
//         completed: true,
//         errors: { all: parseError(error) }
//       });
//     })
//   );

//   return searchResults$;
// };

// const startSearch = async (options: SearchHotelOptions) => {
//   const searchId = uuid.v4();
//   const key = `searchResults-${createFunctionArgsSignature([options])}`;

//   // track(searchId, options);
//   setReqesetResults(searchId, createInitialRequest(searchId, options));
//   const searchResults$ = from(cache.getJSON(key)).pipe(
//     switchMap((cacheResult) => {
//       if (cacheResult) return of(cacheResult);
//       return runSearches(searchId, options);
//     }),
//     share()
//   );

//   searchResults$
//     .pipe(
//       concatMap(async (value) => {
//         setReqesetResults(searchId, value);
//         return value;
//       })
//     )
//     .subscribe({
//       error: async () => {
//         setReqesetResults(searchId, {
//           ...(await getReqesetResults(searchId)),
//           completed: true
//         });
//       }
//     });

//   return searchId;
// };

// const search = async (options: SearchHotelOptions) => {
//   const searchId = await startSearch(options);

//   const results = await getReqesetResults(searchId);
//   if (!results) {
//     return {
//       completed: true,
//       error: true
//     };
//   }

//   return results;
// };

// export default search;
