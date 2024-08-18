import Joi from 'joi';

export const citySchema = Joi.object({
  code: Joi.string(),
  limit: Joi.number().default(20),
  page: Joi.number().default(1)
});
