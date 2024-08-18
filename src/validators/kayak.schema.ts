import JoiBase from 'joi';
import JoiDate from '@joi/date';

const Joi = JoiBase.extend(JoiDate);

export const flightsSchema = Joi.object({
  tripType: Joi.string().valid('round', 'multi', 'oneway').required(),
  cabinClass: Joi.string().required(),
  passengers: Joi.array().items(Joi.number()).length(3).optional(),
  directFlight: Joi.boolean().optional(),
  nearbyAirportOne: Joi.boolean().optional(),
  nearbyAirportTwo: Joi.boolean().optional(),
  legs: Joi.array().items({
    origin: Joi.array().invalid('undefined', 'null').required(),
    destination: Joi.array().invalid('undefined', 'null').required(),
    departure: Joi.string().invalid('undefined', 'null').required(),
    originPlaceType: Joi.string().optional(),
    destinationPlaceType: Joi.string().optional(),
    orig_city: Joi.boolean().optional(),
    dest_city: Joi.boolean().optional(),
    addAlternativeDestinations: Joi.boolean().optional(),
    addAlternativeOrigins: Joi.boolean().optional(),
    _id: Joi.any().optional()
  }),
  nomadLocation: Joi.array().items({
    locations: Joi.array().items(Joi.string()),
    nights_range: Joi.array().items(Joi.number())
  }),
  origin: Joi.any().optional(),
  destination: Joi.any().optional(),
  currency: Joi.string().required(),
  visitorId: Joi.string().optional(),
  adults: Joi.number().required(),
  children: Joi.number().required(),
  infants: Joi.number().required(),
  language: Joi.string().required(),
  country: Joi.string().required(),
  type: Joi.string().valid('Nomad', 'Train', 'flight').default('flight'),
  logId: Joi.string(),
  userData: {
    ip: Joi.string(),
    country_code: Joi.string()
  }
});

export const hotelsSchema = Joi.object({
  id: Joi.number().required(),
  isCity: Joi.boolean().required(),
  checkIn: Joi.date().format('YYYY-MM-DD'),
  checkOut: Joi.date().format('YYYY-MM-DD'),
  currency: Joi.string().required(),
  visitorId: Joi.string().optional(),
  adults: Joi.number().required(),
  children: Joi.number().required(),
  infants: Joi.number().required(),
  rooms: Joi.number().required(),
  language: Joi.string().required(),
  country: Joi.string().required(),
  logId: Joi.string(),
  userData: {
    ip: Joi.string(),
    country_code: Joi.string()
  }
});

export const carsRentalSchema = Joi.object({
  pickUpDate: Joi.date().format('YYYY-MM-DD'),
  dropOffDate: Joi.date().format('YYYY-MM-DD'),
  pickUpLocation: Joi.string().invalid('undefined', 'null').required(),
  dropOffLocation: Joi.string().invalid('undefined', 'null').optional(),
  pickUpHour: Joi.number().min(0).max(23).optional(),
  dropOffHour: Joi.number().min(0).max(23).optional(),
  language: Joi.string().required(),
  country: Joi.string().required(),
  logId: Joi.string(),
  userData: {
    ip: Joi.string(),
    country_code: Joi.string()
  }
});
