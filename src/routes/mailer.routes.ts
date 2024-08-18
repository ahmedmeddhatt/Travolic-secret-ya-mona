import { Router } from 'express';

import { mailer } from '../controllers/mailer.controller';

const mailerEndPoints = (app: Router) => {
  app.post('/mailer/send', mailer);

  return app;
};

export default mailerEndPoints;
