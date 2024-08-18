import { NextFunction, Request, Response } from 'express';
import { Station } from '../models';
import { languageUtil } from '../utils/get-language.util';
import AppError from '../utils/appError.util';
import TranslationService from '../middlewares/translation';

export const getStation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { code } = req.params;
  const language = languageUtil(req);

  let station = await Station.findOne({
    code
  });

  if (!station) {
    return next(new AppError('Station not found', 404));
  }

  station = TranslationService.translate(station, language);

  res.status(200).json(station);
};

export const getStations = async (req: Request, res: Response) => {
  const { page, limit } = req.query;
  const language = languageUtil(req);

  const stations = await Station.paginate(
    {},
    {
      page: Number(page),
      limit: Number(limit)
    }
  );

  stations.docs = TranslationService.interceptor(language, stations.docs);

  return res.status(200).json(stations);
};
