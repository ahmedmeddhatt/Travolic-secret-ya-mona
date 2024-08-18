import Joi from 'joi';

export const confirmCodeSchema = Joi.object({
  email: Joi.string().email().required(),
  confirmCode: Joi.string().required()
});

export const loginFacebooSchema = Joi.object({
  accessToken: Joi.string().required(),
  userId: Joi.string().required()
});

export const loginGoogleSchema = Joi.object({
  tokenId: Joi.string().required()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
});

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  confirmPassword: Joi.string().min(8).required(),
  firstName: Joi.string(),
  lastName: Joi.string(),
  displayName: Joi.string()
});

export const resendCodeSchema = Joi.object({
  email: Joi.string().email().required()
});
