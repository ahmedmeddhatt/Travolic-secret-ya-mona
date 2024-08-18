import { Router } from 'express';

import {
  flightsTrackingPixels,
  hotelsTrackingPixels,
  trainsTrackingPixels,
  transfersTrackingPixels
} from '../controllers/pixels.controller';

const pixelsEndpoints = (app: Router) => {
  app.get('/tr/flights/:provider/pixel', flightsTrackingPixels);
  app.get('/tr/trains/:provider/pixel', trainsTrackingPixels);
  app.get('/tr/transfers/:provider/pixel', transfersTrackingPixels);
  app.get('/tr/hotels/:provider/pixel', hotelsTrackingPixels);

  return app;
};

export default pixelsEndpoints;
