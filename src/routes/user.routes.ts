import { Router } from 'express';

import {
  me,
  getProfile,
  updateProfile,
  updateEmail,
  updatePassword,
  deleteAccount,
  uploadAvatar
} from '../controllers/user.controller';
import {
  addFavouriteSearch,
  getUserFavourites,
  updateUserFavourite,
  deleteUserFavourite
} from '../controllers/favourite.controller';
import { protect } from '../controllers/auth.controller';
import { singleImage } from '../middlewares/multer';
import { addUserAlert } from '../controllers/userAlert.controller';

const userEndpoints = (app: Router) => {
  app.use(protect);

  app.get('/user/me', me);

  app.get('/user/profile', getProfile);

  app.put('/user/profile', updateProfile);

  app.put('/user/email', updateEmail);

  app.put('/user/password', updatePassword);

  app.post('/user/upload/avatar', singleImage('image'), uploadAvatar);

  app.post('/user/favourites', addFavouriteSearch);

  app.get('/user/favourites', getUserFavourites);
  app.delete('/user/favourites', deleteUserFavourite);
  app.put('/user/favourites/:favouritId', updateUserFavourite);
  app.post('/user/userAlert', addUserAlert);

  app.delete('/user/:userId', deleteAccount);

  return app;
};

export default userEndpoints;
