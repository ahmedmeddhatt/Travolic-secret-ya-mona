import { Request, Response, NextFunction } from 'express';
import moment from 'moment';
import uuid from 'uuid';
import { decodeRedirectHotelPayload, decodeRedirectPayload } from '../utils';
import { trackRedirectFailure, trackRedirectHotelFailure } from '../track';
import {
  hotelRedirectSchema,
  redirectSchema
} from '../validators/redirect.schema';
import {
  redirect as redirecting,
  hotelRedirect as hotelRedirecting
} from '../search/redirect';
import AppError from '../utils/appError.util';

export const redirect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = redirectSchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const redirectData = await redirecting(
    value,
    req.headers['Accept-Language'] as string
  );

  return res.status(200).json(redirectData);
};

export const redirectFailure = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = redirectSchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const redirectId = uuid.v4();
  const redirectPayload = decodeRedirectPayload(value.token);

  const data = {
    ...redirectPayload,
    ...value,
    language: req.headers['Accept-Language'] as string,
    timestamp: moment.utc().format()
  };

  await trackRedirectFailure(redirectId, data);

  return res.status(200).json(data);
};

export const hotelRedirectFailure = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = redirectSchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const redirectId = uuid.v4();
  const redirectPayload = decodeRedirectHotelPayload(value.token);

  const data = {
    ...redirectPayload,
    ...value,
    language: req.headers['Accept-Language'] as string,
    timestamp: moment.utc().format()
  };

  await trackRedirectFailure(redirectId, data);

  return res.status(200).json(data);
};

export const hotelRedirect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = hotelRedirectSchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const redirectData = await hotelRedirecting(
    value,
    req.headers['Accept-Language'] as string
  );

  return res.status(200).json(redirectData);
};

export const redirectHotelFailure = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = hotelRedirectSchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const redirectId = uuid.v4();
  const redirectPayload = decodeRedirectPayload(value.token);

  const data = {
    ...redirectPayload,
    ...value,
    language: req.headers['Accept-Language'] as string,
    timestamp: moment.utc().format()
  };

  await trackRedirectHotelFailure(redirectId, data);

  return res.status(200).json(data);
};
