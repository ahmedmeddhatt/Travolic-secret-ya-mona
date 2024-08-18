import Joi from 'joi';

export const searchAirportsSchema = Joi.object({
  lang: Joi.string().required(),
  code: Joi.string().required()
});

export const getAirportsSchema = Joi.object({
  code: Joi.string(),
  city: Joi.string(),
  page: Joi.number().default(1),
  limit: Joi.number().default(10)
});

export const nearbyAiportsSchema = Joi.object({
  lat: Joi.number(),
  lng: Joi.number(),
  language: Joi.string()
});
