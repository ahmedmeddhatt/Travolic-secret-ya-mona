import { Router } from 'express';

import {
  getAllMap,
  getMapOrigin,
  getMapOriginDestination
} from '../controllers/map.controller';

const mapEndpoints = (app: Router) => {
  app.get('/map', getAllMap);
  app.get('/map/origin', getMapOrigin);
  app.get('/map/origin/destination', getMapOriginDestination);

  return app;
};

export default mapEndpoints;
