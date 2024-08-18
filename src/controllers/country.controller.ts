import { Request, Response, NextFunction } from 'express';

import TranslationService from '../middlewares/translation';
import { languageUtil } from '../utils/get-language.util';

import {
  countrySchema,
  countrySearchSchema
} from '../validators/country.schema';
import AppError from '../utils/appError.util';
import { Country } from '../models';

export const getCountries = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = countrySchema.validate(req.query);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const language = languageUtil(req);

  const countries = await Country.paginate(
    {},
    {
      page: value.page,
      limit: value.limit
    }
  );

  if (countries.length === 0) {
    return next(new AppError('No country found', 404));
  }

  const docs = TranslationService.interceptor(language, countries.docs);

  countries.docs = docs.map((doc, index) => {
    return { ...doc, enName: countries.docs[index].name };
  });

  return res.status(200).json(countries);
};

export const searchCountries = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = countrySearchSchema.validate(req.query);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const { searchKey } = value;

  let countries = await Country.find({
    $or: [
      {
        name: {
          $regex: '^' + searchKey,
          $options: 'i'
        }
      },
      {
        code: {
          $regex: '^' + searchKey,
          $options: 'i'
        }
      }
    ]
  });

  const language = languageUtil(req);

  if (countries.length === 0) {
    return next(new AppError('No countries found', 404));
  }

  countries = TranslationService.interceptor(language, countries);

  return res.status(200).json(countries);
};

export const getCountry = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { code } = req.params;
  let data = await Country.findOne({ code });
  if (!data) {
    return next(new AppError('No Country found', 404));
  }
  const language = languageUtil(req);
  data = TranslationService.interceptor(language, [data]);
  res.status(200).json(data[0]);
};
