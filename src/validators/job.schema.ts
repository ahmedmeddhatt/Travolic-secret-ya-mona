import Joi from 'joi';

export const jobSchema = Joi.object({
  name: Joi.string().required(),
  department: Joi.string().required(),
  location: Joi.string().required(),
  firstSalaryRange: Joi.string().required(),
  secondSalaryRange: Joi.string().required(),
  currency: Joi.string().required(),
  status: Joi.string().required(),
  type: Joi.string().required()
});
