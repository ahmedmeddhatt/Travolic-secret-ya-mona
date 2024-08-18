import { Router } from 'express';

import {
  getCountries,
  getCountry,
  searchCountries
} from '../controllers/country.controller';

const countryEndpoints = (app: Router) => {
  app.get('/countries', getCountries);
  app.get('/countries/search', searchCountries);
  app.get('/country/:code', getCountry);

  return app;
};

export default countryEndpoints;
