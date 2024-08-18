import Joi from 'joi';

export const contactUsByEmailAuth = Joi.object({
  subject: Joi.string().required(),
  message: Joi.string().required(),
  from: Joi.string().email().optional()
});

export const contactUsByEmailUnAuth = Joi.object({
  fullName: Joi.string().required(),
  subject: Joi.string().required(),
  message: Joi.string().required(),
  from: Joi.string().email().required()
});
