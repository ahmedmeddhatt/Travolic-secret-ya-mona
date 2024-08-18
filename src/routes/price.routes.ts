import { Router } from 'express';

import {
  priceAlert,
  deleteSubscription,
  turnOffNotification
} from '../controllers/price.controller';

const priceAlertEndpoints = (app: Router) => {
  app.get('/price-alert/:requestId', priceAlert);
  app.get('/price-alert/notification/:userId', turnOffNotification);
  app.get('/price-alert/unsubscribe/:userId', deleteSubscription);

  return app;
};

export default priceAlertEndpoints;
