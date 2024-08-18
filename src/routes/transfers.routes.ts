import { Router } from 'express';

import {
  searchTransferProvider,
  initTransferSearch
} from '../controllers/transfer.controller';

import { slowRateLimiterMiddleware } from '../middlewares/limiter';
import reCAPTCHA from '../middlewares/reCAPTCHA';

const transfersEndPoints = (app: Router) => {
  app.post(
    '/searchTransfer/init',
    slowRateLimiterMiddleware,
    initTransferSearch
  );
  app.post(
    '/v2/searchTransfer/init',
    slowRateLimiterMiddleware,
    reCAPTCHA,
    initTransferSearch
  );

  app.post('/searchTransfer/:provider', searchTransferProvider);
  app.post('/v2/searchTransfer/:provider', searchTransferProvider);

  app.post('/searchTransfer/:searchId/:provider', searchTransferProvider);
  app.post('/v2/searchTransfer/:searchId/:provider', searchTransferProvider);

  return app;
};

export default transfersEndPoints;
