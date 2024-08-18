import { Router } from 'express';
import {
  initNomadProvider,
  initSearch,
  searchNomadProvider,
  searchNomadProviderWithoutToken,
  searchProvider,
  searchProviderWithoutToken,
  searchRequestId,
  shareFlight,
  flight90TrackSearch,
  trackFlight90Source,
  searchProviderFromCityToCity,
  searchProviderWithoutTokenFromCityToCity,
  initSearchV2
} from '../controllers/flight.controller';
import reCAPTCHA from '../middlewares/reCAPTCHA';
import { protect } from '../controllers/auth.controller';
// import rateLimit from 'express-rate-limit';

// Define the rate limiter for the specific route
// const searchLimiter = rateLimit({
//   windowMs: 60 * 1000, // 1 minute
//   max: 3, // limit each IP to 3 requests per windowMs
//   message: 'Too many searches attempts from this IP, please try again later.',
//   headers: true, // Send rate limit info in the response headers
//   keyGenerator: (req) => {
//     return req.ip; // Use req.ip as the key
//   }
// });

const flightSearchEndpoints = (app: Router) => {
  app.use(protect);

  app.post('/searchNomad/init', initNomadProvider);
  app.post('/searchNomad/:searchId/:provider', searchNomadProvider);
  app.post('/searchNomad/:provider', searchNomadProviderWithoutToken);

  app.post('/search/init', initSearch);
  app.post('/search/init/v2', reCAPTCHA, initSearchV2);
  app.post('/search/init/v2/rate', initSearchV2);
  app.post('/v2/search/init/v2', initSearchV2);
  app.post('/search/:searchId/:provider', searchProvider);

  app.post('/v2/search/init', reCAPTCHA, initSearch);

  app.post('/v2/search/:searchId/:provider', reCAPTCHA, searchProvider);

  app.post(
    '/v3/search/:searchId/:provider',
    reCAPTCHA,
    searchProviderFromCityToCity
  );
  app.post('/v3/search/:provider', searchProviderWithoutTokenFromCityToCity);

  app.post('/search/:provider', searchProviderWithoutToken);
  app.get('/search/:requestId', searchRequestId);
  app.get('/v2/search/:requestId', searchRequestId);

  app.get('/share-flight', shareFlight);
  app.post('/flight90', flight90TrackSearch);
  app.post('/flight90/source', trackFlight90Source);
  return app;
};

export default flightSearchEndpoints;
