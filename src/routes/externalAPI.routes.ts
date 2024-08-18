import { Router } from 'express';
import {
  initSearch,
  getResults,
  protect
} from '../controllers/externalAPI.controller';
import { slowRateLimiterMiddleware } from '../middlewares/limiter';

const externalAPIRouter = (app: Router) => {
  app.use('/externalAPI/v1', protect);

  app.post('/externalAPI/v1', initSearch);
  app.post('/externalAPI/v1/r1', slowRateLimiterMiddleware, initSearch);

  app.get('/externalAPI/v1/:searchId', getResults);
  return app;
};

export default externalAPIRouter;
