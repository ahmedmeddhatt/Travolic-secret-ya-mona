import { Router } from 'express';

import {
  getCurrencies,
  searchCurrencies
  // currencyRate
} from '../controllers/currency.controller';

const currencyEndpoints = (app: Router) => {
  app.get('/currencies', getCurrencies);
  app.get('/currencies/search', searchCurrencies);
  // app.get('/currencies/rate', currencyRate);

  return app;
};

export default currencyEndpoints;
