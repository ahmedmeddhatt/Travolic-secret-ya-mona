import { Request, Response, NextFunction } from 'express';
import { locationSchema } from '../validators/location.schema';
import { Location } from '../models';
import AppError from '../utils/appError.util';

export const addLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = locationSchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const location = await Location.create(value);

  return res.status(200).json(location);
};

export const getAllLocations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const locations = await Location.find();

  if (!locations) {
    return next(new AppError('No locations found', 404));
  }

  return res.status(200).json(locations);
};
