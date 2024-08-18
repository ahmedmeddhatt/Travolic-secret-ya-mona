import { Router } from 'express';

import { getCities, getCity } from '../controllers/city.controller';

const cityEndpoints = (app: Router) => {
  app.get('/cities', getCities);
  app.get('/cities/:code', getCity);

  return app;
};

export default cityEndpoints;
