import Joi from 'joi';

export const countrySearchSchema = Joi.object({
  searchKey: Joi.string().required()
});

export const countrySchema = Joi.object({
  limit: Joi.number().default(20),
  page: Joi.number().default(1)
});
