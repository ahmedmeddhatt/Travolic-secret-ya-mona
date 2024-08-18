import { Router } from 'express';

import { contactUs } from '../controllers/contactUs.controller';

const contactUsEndpoints = (app: Router) => {
  app.post('/contact-us', contactUs);

  return app;
};

export default contactUsEndpoints;
