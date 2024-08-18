import { NextFunction, Request, Response } from 'express';
import { getAircraftsSchema } from '../validators/aircraftsDB.schema';
import { getAircraftsService } from '../services/aircraftDB.service';
import AppError from '../utils/appError.util';

export const getAircrafts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = getAircraftsSchema.validate(req.query);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const { page, limit } = value;

  const results = await getAircraftsService(page, limit);

  return res.status(200).json(results);
};
