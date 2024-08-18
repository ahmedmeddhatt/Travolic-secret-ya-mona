import { Request } from 'express';
import { LanguageEnum } from '../enums/language.enum';

export const languageUtil = (req: Request): string => {
  const DEFAULT_LANGUAGE: LanguageEnum = LanguageEnum.en;
  const languages = Object.values(LanguageEnum);
  const language =
    req.headers['accept-language'] &&
    languages.includes(req.headers['accept-language'] as LanguageEnum)
      ? req.headers['accept-language']
      : req.query.language
      ? req.query.language
      : DEFAULT_LANGUAGE;
  return language as string;
};
