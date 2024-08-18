import { Router } from 'express';

import {
  autoComplete,
  placeId,
  distanceMatrix
} from '../controllers/google.controller';

const googleApiEndpoints = (app: Router) => {
  app.get('/autocomplete', autoComplete);
  app.get('/place', placeId);
  app.get('/distanceMatrix', distanceMatrix);

  return app;
};

export default googleApiEndpoints;
