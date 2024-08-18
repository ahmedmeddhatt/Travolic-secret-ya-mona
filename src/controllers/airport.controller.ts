import { NextFunction, Request, Response } from 'express';

import {
  getAirportService,
  getAirportsService,
  nearByService,
  searchAirportsService
} from '../services/airport.service';
import { languageUtil } from '../utils/get-language.util';
import {
  getAirportsSchema,
  searchAirportsSchema
} from '../validators/airports.schema';
import AppError from '../utils/appError.util';

export const Search = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = searchAirportsSchema.validate(req.query);
  const language = languageUtil(req);

  if (error) {
    return res.status(422).json({
      status: 'fail',
      message: error.details[0].message
    });
  }

  const results = await searchAirportsService(value.code, language);

  if (results.status === 'Error') {
    return next(new AppError(results.message, results.code));
  }

  res.status(200).json(results);
};

export const getAirport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { code } = req.params;
  const language = languageUtil(req);
  const result = await getAirportService(code, language);

  if (result.status === 'Error') {
    return next(new AppError(result.message, result.code));
  }

  res.status(200).json(result);
};

export const getAirports = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = getAirportsSchema.validate(req.query);
  const language = languageUtil(req);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const { page, limit } = value;

  const results = await getAirportsService(page, limit, language);

  return res.status(200).json(results);
};

export const NearBy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const language = languageUtil(req);

  const results = await nearByService(req.ip, req.query, language);

  if (results.status === 'Error') {
    return next(new AppError(results.message, results.code));
  }

  res.status(200).json(results);
};
