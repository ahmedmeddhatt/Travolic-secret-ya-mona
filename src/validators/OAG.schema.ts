import Joi from 'joi';

export const flightSchedulesSchema = Joi.object({
  DepartureDate: Joi.string().required(),
  DepartureAirport: Joi.string().required(),
  ArrivalAirport: Joi.string().required(),
  version: Joi.string().optional(),
  ArrivalDate: Joi.string().optional()
});
