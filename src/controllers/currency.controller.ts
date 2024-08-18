import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import TranslationService from '../middlewares/translation';
import { languageUtil } from '../utils/get-language.util';
import { Currency } from '../models';
import {
  currencySchema,
  currencySearchSchema,
  currencyRateSchema
} from '../validators/currency.schema';
import AppError from '../utils/appError.util';
import logger from '../configs/logger';
import moment from 'moment';
import { getJSON, setJSON } from '../utils/cache.util';

const { CURRENCY_CONVERSION_API_URL, CURRENCY_CONVERSION_API_KEY } =
  process.env;

export const getCurrencies = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = currencySchema.validate(req.query);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const { limit, page } = value;

  const currencies = await Currency.paginate(
    {},
    {
      page,
      limit
    }
  );
  const language = languageUtil(req);

  if (currencies.length === 0) {
    return next(new AppError('No currencies found', 404));
  }

  currencies.docs = TranslationService.interceptor(language, currencies.docs);

  return res.status(200).json(currencies);
};

export const searchCurrencies = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = currencySearchSchema.validate(req.query);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const { searchKey } = value;

  let currencies = await Currency.find({
    $or: [
      {
        code: {
          $regex: '^' + searchKey,
          $options: 'i'
        }
      },
      {
        name: {
          $regex: '^' + searchKey,
          $options: 'i'
        }
      }
    ]
  });
  const language = languageUtil(req);

  if (currencies.length === 0) {
    return next(new AppError('No currencies found', 404));
  }

  currencies = TranslationService.interceptor(language, currencies);

  return res.status(200).json(currencies);
};

export const currencyRate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = currencyRateSchema.validate(req.query);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const { from, to } = value;

  const key = `currency-rate-${from}`;
  let currenciesRates = await getJSON(key);

  if (!currenciesRates) {
    const url = `${CURRENCY_CONVERSION_API_URL}?app_id=${CURRENCY_CONVERSION_API_KEY}&base=${from}`;
    const data = await axios
      .get(url)
      .then((res) => res.data.rates)
      .catch((err: Error) => {
        logger.error(err);
        return {};
      });

    currenciesRates = data;
    await setJSON(key, currenciesRates, {
      duration: moment.duration({
        minutes: 1500
      })
    });
  }

  return res.status(200).json({
    ratio: currenciesRates[to]
  });
};
