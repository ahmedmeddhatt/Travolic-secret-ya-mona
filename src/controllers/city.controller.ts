import { Request, Response, NextFunction } from 'express';
import TranslationService from '../middlewares/translation';
import { citySchema } from '../validators/city.schema';
import { City } from '../models';
import AppError from '../utils/appError.util';
import { languageUtil } from '../utils/get-language.util';

export const getCities = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = citySchema.validate(req.query);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const { page, limit } = value;

  const cities = await City.paginate({}, { page, limit });

  if (cities.length === 0) {
    return next(new AppError('No city found', 404));
  }

  const language = languageUtil(req);

  const docs = TranslationService.interceptor(language, cities.docs);

  cities.docs = docs.map((doc, index) => {
    return { ...doc, enName: cities.docs[index].name };
  });

  return res.status(200).json(cities);
};

export const getCity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { code } = req.params;

  let result = await City.findOne({ code });

  if (!result) {
    return next(new AppError('No city found', 404));
  }

  const language = languageUtil(req);

  result = TranslationService.interceptor(language, [result]);

  res.status(200).json(result[0]);
};
