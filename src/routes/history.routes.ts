import { Router } from 'express';

import {
  getUserSearches,
  deleteUserSearch
} from '../controllers/history.controller';
import { protect } from '../controllers/auth.controller';

const historyEndpoints = (app: Router) => {
  app.use(protect);

  app.get('/user/search-history', getUserSearches);
  app.delete('/user/search-history', deleteUserSearch);

  return app;
};

export default historyEndpoints;
