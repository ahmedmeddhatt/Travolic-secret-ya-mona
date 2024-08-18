import { Router } from 'express';

import {
  searchFlightPlaces,
  searchFlightPlacesV2,
  searchStationPlaces,
  searchStationPlacesV2,
  searchCityPlaces,
  searchHotelPlaces,
  searchHotelsPlacesV2,
  searchFlightPlacesES
} from '../controllers/place.controller';

const placeEndpoints = (app: Router) => {
  app.get('/places/flights/search', searchFlightPlaces);
  app.get('/places/stations/search', searchStationPlaces);
  app.get('/places/cities/search', searchCityPlaces);
  app.get('/places/hotels/search', searchHotelPlaces);
  app.get('/places/v2/flights/search', searchFlightPlacesV2);
  app.get('/places/v2/flights', searchFlightPlacesES);
  app.get('/places/v2/stations/search', searchStationPlacesV2);
  app.get('/places/v2/hotels/search', searchHotelsPlacesV2);

  return app;
};

export default placeEndpoints;
