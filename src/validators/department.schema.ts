import Joi from 'joi';

export const departmentSchema = Joi.object({
  name: Joi.string().required()
});
