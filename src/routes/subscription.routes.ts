import { Router } from 'express';

import {
  addSubscription,
  getSubscriptions
} from '../controllers/subscription.controller';

const subscriptionEndpoints = (app: Router) => {
  // app.use(
  //   passport.authenticate('jwt', { session: false, failWithError: true })
  // );
  app.route('/subscription').get(getSubscriptions).post(addSubscription);

  return app;
};

export default subscriptionEndpoints;
