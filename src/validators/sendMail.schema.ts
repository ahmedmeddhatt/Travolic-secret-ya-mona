import Joi from 'joi';

export const MailValidator = Joi.object({
  to: Joi.string().email().required(),
  subject: Joi.string().required(),
  text: Joi.string().required(),
  html: Joi.string().optional()
});
