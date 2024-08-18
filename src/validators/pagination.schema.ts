import Joi from 'joi';

export const paginationSchema = Joi.object({
  page: Joi.number().default(1),
  limit: Joi.number().default(10),
  type: Joi.string()
});
