import { Router } from 'express';

import {
  trending,
  trendingAirports,
  trending2,
  trendingAirports2,
  trendingCities,
  trendingNearBy,
  topCountries,
  cheapestflightsSearch,
  popularFlight,
  flightInfo,
  cheapestAirlinesPrices,
  cheapestFlightsPerMonths,
  cheapestFlightsEveryWhere,
  getFAQsData
} from '../controllers/trending.controller';

const trendingEndpoints = (app: Router) => {
  app.get('/trending', trending);
  app.get('/trending/airports', trendingAirports);
  app.get('/v2/trending', trending2);
  app.get('/v2/trending/airports', trendingAirports2);
  app.get('/trending/cities', trendingCities);
  app.get('/trending/nearBy', trendingNearBy);
  app.get('/trending/countries', topCountries);
  app.get('/popularFlights', popularFlight);
  app.get('/flightInfo', flightInfo);
  app.get('/cheapest-flights-search', cheapestflightsSearch);
  app.get('/cheapest-airlines-prices', cheapestAirlinesPrices);
  app.get('/cheapest-flights-per-months', cheapestFlightsPerMonths);
  app.get('/cheapest-flights-everywhere', cheapestFlightsEveryWhere);
  app.get('/faqs-data', getFAQsData);
  return app;
};

export default trendingEndpoints;
