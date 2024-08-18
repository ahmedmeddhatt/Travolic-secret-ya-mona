import { Router } from 'express';

import {
  redirect,
  initTrainSearch,
  searchTrainProvider,
  searchTrainProviderWithoutToken
} from '../controllers/train.controller';

import reCAPTCHA from '../middlewares/reCAPTCHA';
import { slowRateLimiterMiddleware } from '../middlewares/limiter';

const flightSearchEndpoints = (app: Router) => {
  app.post('/searchTrain/init', slowRateLimiterMiddleware, initTrainSearch);
  app.post('/searchTrain/redirect', redirect);
  app.post(
    '/v2/searchTrain/init',
    slowRateLimiterMiddleware,
    reCAPTCHA,
    initTrainSearch
  );
  app.post('/searchTrain/:searchId/:provider', searchTrainProvider);
  app.post(
    '/v2/searchTrain/:searchId/:provider',
    reCAPTCHA,
    searchTrainProvider
  );

  app.post('/searchTrain/:provider', searchTrainProviderWithoutToken);

  return app;
};

export default flightSearchEndpoints;
