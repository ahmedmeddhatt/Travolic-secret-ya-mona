import { Router } from 'express';

import { getStations, getStation } from '../controllers/station.controller';

const stationEndpoints = (app: Router) => {
  app.get('/stations', getStations);
  app.get('/stations/:code', getStation);

  return app;
};

export default stationEndpoints;
