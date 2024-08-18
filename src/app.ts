import express from 'express';
import cors from 'cors';
import compression from 'compression';
import passport from 'passport';
import helmet from 'helmet';

import JWTStrategy from './services/strategies/jwt.strategy';
import { Facebook } from './services/strategies/facebook.starategy';
import { Google } from './services/strategies/google.starategy';
import { AnonymousAuth } from './services/strategies/anonymous.starategy';

import subscriptionEndpoints from './routes/subscription.routes';
import authEndpoints from './routes/auth.routes';
import userEndpoints from './routes/user.routes';
import flightSearchEndpoints from './routes/flight.routes';
import jobsEndpoints from './routes/job.routes';
import reviewsEndpoints from './routes/review.routes';
import priceEndpoints from './routes/price.routes';
import mailerEndPoints from './routes/mailer.routes';
import contactUsEndpoints from './routes/contactUs.routes';
import mapEndpoints from './routes/map.routes';
import trendingEndpoints from './routes/trending.routes';
import airportEndpoints from './routes/airport.routes';
import placeEndpoints from './routes/place.routes';
import countryEndpoints from './routes/country.routes';
import currencyEndpoints from './routes/currency.routes';
import cityEndpoints from './routes/city.routes';
import googleApiEndpoints from './routes/google.routes';
import hotelSearchEndpoints from './routes/hotel.routes';
import pixelsEndpoints from './routes/pixels.routes';
import transferEndpoints from './routes/transfers.routes';
import trainEndpoints from './routes/train.routes';
import redirectEndpoints from './routes/redirect.routes';
import historyEndpoints from './routes/history.routes';
import pluginEndpoints from './routes/plugin.routes';
import airlineEndpoints from './routes/airline.routes';
import stationEndpoints from './routes/station.routes';
import ExternalAPI from './routes/externalAPI.routes';
import aircraftDBEndpoints from './routes/aircraftDB.routes';
import disableRoutes from './middlewares/disabledRoutes';
import { successHandle, errorHandle } from './configs/morgan';
import errorHandler from './middlewares/errorHandler';

const { FLIGHT_ENABLE, TRAIN_ENABLE, TRANSFER_ENABLE, HOTEL_ENABLE } =
  process.env;

const app = express();

app.enable('trust proxy');
app.disable('x-powered-by');
app.use(compression());
app.use(
  cors({
    origin: '*'
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(successHandle);
app.use(errorHandle);

app.use(disableRoutes);
ExternalAPI(app);

AnonymousAuth.init(passport);
JWTStrategy.init(passport);
Facebook.init(passport);
Google.init(passport);

app.get('/', function (req, res) {
  if (req.user) {
    res.json({ status: 'ok user', user: req.user });
  } else {
    res.json({ status: 'ok' });
  }
});

if (HOTEL_ENABLE === 'true') {
  hotelSearchEndpoints(app);
}

if (FLIGHT_ENABLE === 'true') {
  flightSearchEndpoints(app);
}

if (TRANSFER_ENABLE === 'true') {
  transferEndpoints(app);
}

if (TRAIN_ENABLE === 'true') {
  trainEndpoints(app);
}

pluginEndpoints(app);
cityEndpoints(app);
currencyEndpoints(app);
countryEndpoints(app);
placeEndpoints(app);
reviewsEndpoints(app);
redirectEndpoints(app);
pixelsEndpoints(app);
priceEndpoints(app);
mailerEndPoints(app);
contactUsEndpoints(app);
mapEndpoints(app);
trendingEndpoints(app);
airportEndpoints(app);
authEndpoints(app);
googleApiEndpoints(app);
stationEndpoints(app);
airlineEndpoints(app);
aircraftDBEndpoints(app);

app.use(passport.authenticate('jwt', { session: false, failWithError: true }));

subscriptionEndpoints(app);
jobsEndpoints(app);
historyEndpoints(app);
userEndpoints(app);

app.all('*', (req, res) => {
  return res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

app.use(errorHandler);

export default app;
