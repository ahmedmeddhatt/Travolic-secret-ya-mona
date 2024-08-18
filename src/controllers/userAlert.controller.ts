import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/appError.util';
import {
  addToUserAlertSchema,
  updateUserAlertSchema
} from '../validators/user.schema';
import UserAlerts from '../models/user-alert';

export const addUserAlert = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { error, value } = addToUserAlertSchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }
  const userId = req.user.id;
  const userAlertAdded = await UserAlerts.create({
    userId,
    ...value
  });
  return res.status(200).json(userAlertAdded);
};
export const updateUserAlert = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { favouritId } = req.params;
  const { error, value } = updateUserAlertSchema.validate({
    ...req.body
  });

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const { active } = value;
  const updatedUserAlert = await UserAlerts.findById(favouritId);

  if (!updatedUserAlert) {
    return next(new AppError('Favourite not found', 404));
  }

  if (updatedUserAlert.userId.toString() !== req.user._id.toString()) {
    return next(
      new AppError('You are not authorized to update this favourite', 403)
    );
  }

  if (active) {
    updatedUserAlert.active = active;
  }

  await updatedUserAlert.save();

  return res.status(200).json(updatedUserAlert);
};
