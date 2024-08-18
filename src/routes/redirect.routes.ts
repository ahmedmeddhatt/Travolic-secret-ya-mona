import { Router } from 'express';
// import rateLimit from 'express-rate-limit';
import reCAPTCHA from '../middlewares/reCAPTCHA';

import { redirect, redirectFailure } from '../controllers/redirect.controller';

// const redirectLimiter = rateLimit({
//   windowMs: 60 * 1000, // 1 minute
//   max: 5, // limit each IP to 5 requests per windowMs
//   message: 'Too many redirects attempts from this IP, please try again later.',
//   headers: true, // Send rate limit info in the response headers
//   keyGenerator: (req) => {
//     return req.ip; // Use req.ip as the key
//   }
// });

const redirectEndpoints = (app: Router) => {
  app.post('/redirect', redirect);
  app.post('/redirect/failure', reCAPTCHA, redirectFailure);

  return app;
};

export default redirectEndpoints;
