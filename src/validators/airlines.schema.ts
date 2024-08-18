import Joi from 'joi';

export const getAirlinesSchema = Joi.object({
  page: Joi.number().default(1),
  limit: Joi.number().default(10)
});

export const searchAirlineSchema = Joi.object({
  searchKey: Joi.string().required()
});
