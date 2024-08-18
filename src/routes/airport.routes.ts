import { Router } from 'express';

import {
  Search,
  getAirports,
  NearBy,
  getAirport
} from '../controllers/airport.controller';

const airportEndpoints = (app: Router) => {
  app.get('/airports/search', Search);
  app.get('/airports/nearby', NearBy);
  app.get('/airports', getAirports);
  app.get('/airports/:code', getAirport);

  return app;
};

export default airportEndpoints;
