import { Request, Response, NextFunction } from 'express';
import { Airline } from '../models';
import {
  getAirlinesSchema,
  searchAirlineSchema
} from '../validators/airlines.schema';
import TranslationService from '../middlewares/translation';
import { languageUtil } from '../utils/get-language.util';
import AppError from '../utils/appError.util';

export const search = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = searchAirlineSchema.validate(req.query);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const { searchKey } = value;
  const language = languageUtil(req);

  let airlines: any = await Airline.find({
    $or: [
      { code: { $regex: searchKey.replace(/[^a-zA-Z ]/g, ''), $options: 'i' } },
      { name: { $regex: searchKey.replace(/[^a-zA-Z ]/g, ''), $options: 'i' } }
    ]
  });

  if (airlines.length === 0) {
    return next(new AppError('No airline found', 404));
  }

  airlines = TranslationService.interceptor(language, airlines);

  airlines = airlines.map((item: any) => {
    return {
      code: item.code,
      name: item.name,
      image: item.image ? item.image.pathWithFilename : ''
    };
  });

  return res.status(200).json(airlines);
};

export const getAirlines = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = getAirlinesSchema.validate(req.query);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const { page, limit } = value;
  const language = languageUtil(req);

  const airlines: any = await Airline.paginate(
    {},
    {
      page,
      limit,
      populate: 'image'
    }
  );

  airlines.docs = TranslationService.interceptor(language, airlines.docs);

  airlines.docs = airlines.docs.map((item: any) => {
    return {
      code: item.code,
      name: item.name,
      image: item.image ? item.image.pathWithFilename : ''
    };
  });

  return res.status(200).json(airlines);
};
