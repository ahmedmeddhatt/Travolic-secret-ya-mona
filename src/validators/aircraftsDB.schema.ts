import Joi from 'joi';

export const getAircraftsSchema = Joi.object({
  page: Joi.number().default(1),
  limit: Joi.number().default(10)
});
