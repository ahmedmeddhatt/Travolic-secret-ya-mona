import { Router } from 'express';
import { search, getAirlines } from '../controllers/airline.controller';

const airlineEndpoints = (app: Router) => {
  app.get('/airlines', getAirlines);
  app.get('/airlines/search', search);
  return app;
};

export default airlineEndpoints;
