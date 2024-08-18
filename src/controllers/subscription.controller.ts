import { Request, Response, NextFunction } from 'express';
import { Subscription } from '../models';
import { getSubscriptionsSchema } from '../validators/subscription.schema';
import AppError from '../utils/appError.util';

export const addSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { _id: userId, email } = req.user;

  let subscription = await Subscription.findOne({
    userId,
    email
  });

  if (subscription) {
    return next(new AppError('You have already subscribed', 422));
  }

  subscription = await Subscription.create({
    userId,
    email
  });

  return res.status(201).json(subscription);
};

export const getSubscriptions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = getSubscriptionsSchema.validate(req.query);
  const { email, page, limit } = value;

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const filter: any = {};

  if (value.email) {
    filter.email = email;
  }

  const subscriptions = await Subscription.find(filter, {}, {})
    .populate('userId', ['displayName', 'avatarUrl', 'email'])
    .skip(page - 1)
    .limit(limit)
    .sort({ updatedAt: -1 });

  return res.status(200).json(subscriptions);
};
