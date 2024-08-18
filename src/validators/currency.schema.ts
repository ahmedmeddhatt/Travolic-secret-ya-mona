import Joi from 'joi';

export const currencySearchSchema = Joi.object({
  searchKey: Joi.string().required()
});

export const currencySchema = Joi.object({
  limit: Joi.number().default(20),
  page: Joi.number().default(1)
});

export const currencyRateSchema = Joi.object({
  from: Joi.string().required(),
  to: Joi.string().required()
});
