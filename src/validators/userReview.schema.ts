import Joi from 'joi';
import { RatingEnum } from '../enums/rating-enum';

export const addAuthReviewSchema = Joi.object({
  text: Joi.string().required(),
  title: Joi.string().required(),
  rating: Joi.number().integer().min(1).max(5).required()
});

export const addReviewSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  text: Joi.string().required(),
  title: Joi.string().required(),
  rating: Joi.number().integer().min(1).max(5).required()
});

export const getReviewsSchema = Joi.object({
  rating: Joi.string()
    .valid(...Object.values(RatingEnum))
    .optional(),
  dateFrom: Joi.string().optional(),
  page: Joi.number().required().default(1),
  limit: Joi.number().required().default(10)
});

export const addReactionSchema = Joi.object({
  reaction: Joi.string().required().valid('Like', 'Dislike')
});

export const addCommentSchema = Joi.object({
  email: Joi.string().email().required(),
  text: Joi.string().required(),
  name: Joi.string().required()
});
