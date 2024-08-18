import Joi from 'joi';

export const redirectSchema = Joi.object({
  token: Joi.string().required(),
  searchId: Joi.string().allow(null, ''),
  visitorId: Joi.string().allow(null, ''),
  itineraryId: Joi.string(),
  legs: Joi.any(),
  price: Joi.number().required(),
  adults: Joi.number().required(),
  children: Joi.number().required(),
  infants: Joi.number().required(),
  reference: Joi.string().optional(),
  currency: Joi.string().required(),
  country: Joi.string(),
  type: Joi.string().required(),
  segments: Joi.any().default([]),
  utm_source: Joi.string()
});

export const hotelRedirectSchema = Joi.object({
  token: Joi.string().required(),
  searchId: Joi.string().allow(null, ''),
  visitorId: Joi.string().allow(null, ''),
  itineraryId: Joi.string(),
  hotelId: Joi.string(),
  checkIn: Joi.string(),
  checkOut: Joi.string(),
  price: Joi.number().required(),
  adults: Joi.number().required(),
  children: Joi.number().required(),
  infants: Joi.number().required(),
  reference: Joi.string().optional(),
  currency: Joi.string().required(),
  country: Joi.string(),
  type: Joi.string().required(),
  segments: Joi.any().default([]),
  utm_source: Joi.string()
});
