import { Router } from 'express';

import { getAircrafts } from '../controllers/aircraftDB.controller';

const aircraftDBEndpoints = (app: Router) => {
  app.get('/aircraftsDB', getAircrafts);

  return app;
};

export default aircraftDBEndpoints;
