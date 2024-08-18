import { Request, Response, NextFunction } from 'express';
import { Department } from '../models';
import { departmentSchema } from '../validators/department.schema';
import AppError from '../utils/appError.util';

export const addDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = departmentSchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const department = await Department.create(value);

  return res.status(201).json(department);
};

export const getAllDepartments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const departments = await Department.find();

  if (!departments) {
    return next(new AppError('No departments found', 404));
  }

  return res.status(200).json(departments);
};
