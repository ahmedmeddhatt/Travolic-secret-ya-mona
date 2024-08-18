import { Router } from 'express';

import reCAPTCHA from '../middlewares/reCAPTCHA';
import { slowRateLimiterMiddleware } from '../middlewares/limiter';
import {
  initHotelSearch,
  searchHotelProvider,
  searchHotelProviderWithoutToken
} from '../controllers/hotel.controller';

const hotelSearchEndpoints = (app: Router) => {
  app.post('/searchHotel/init', slowRateLimiterMiddleware, initHotelSearch);
  app.post(
    '/v2/searchHotel/init',
    slowRateLimiterMiddleware,
    reCAPTCHA,
    initHotelSearch
  );
  app.post('/searchHotel/:searchId/:provider', searchHotelProvider);
  app.post(
    '/v2/searchHotel/:searchId/:provider',
    reCAPTCHA,
    searchHotelProvider
  );

  app.post('/searchHotel/:provider', searchHotelProviderWithoutToken);

  return app;
};

export default hotelSearchEndpoints;
