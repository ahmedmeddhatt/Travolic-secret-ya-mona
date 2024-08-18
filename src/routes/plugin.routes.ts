import { Router } from 'express';

import {
  flyerProgram,
  flyerCalculate,
  searchPricesFilters,
  predict,
  covid,
  radical,
  dataPackage,
  amenitiesPackage,
  seatMaps,
  publicHolidays,
  flightSchedule,
  apiUpdateStatus,
  getMediaAlphaAds,
  kayakCompareToCarRental,
  kayakCompareToFlights,
  kayakInlineAdsFlights,
  getHotelsMediaAlphaAds,
  flyerCalculateV2
} from '../controllers/plugins.controller';

const flightSearchEndpoints = (app: Router) => {
  app.post('/search-filters/:searchId', searchPricesFilters);
  app.post('/flyer/calculate', flyerCalculate);
  app.post('/flyer/calculate/v2', flyerCalculateV2);
  app.post('/predict', predict);
  app.get('/flyer/programs', flyerProgram);
  app.get('/covid', covid);
  app.get('/radical', radical);
  app.get('/data-package', dataPackage);
  app.post('/amenities-package', amenitiesPackage);
  app.post('/seatMaps-data', seatMaps);
  app.get('/public-holidays', publicHolidays);
  app.get('/flight-schedule', flightSchedule);
  app.get('/update-status', apiUpdateStatus);
  app.post('/mediaalpha-ads', getMediaAlphaAds);
  app.post('/kayak/compareTo/flights', kayakCompareToFlights);
  app.post('/kayak/compareTo/carsRental', kayakCompareToCarRental);
  app.post('/kayak/inline/flights', kayakInlineAdsFlights);
  app.post('/mediaalpha-ads/hotels', getHotelsMediaAlphaAds);

  return app;
};

export default flightSearchEndpoints;
