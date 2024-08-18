import Joi from 'joi';

export const getSubscriptionsSchema = Joi.object({
  email: Joi.string().optional(),
  page: Joi.number().default(1),
  limit: Joi.number().default(10)
});

export const addReviewSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().required()
});
