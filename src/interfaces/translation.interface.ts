import { Document } from 'mongoose';
import { LanguageEnum } from '../enums/language.enum';

export interface ITranslation {
  language: LanguageEnum;
  name?: string;
  destinationName?: string;
  originName?: string;
  originCityName?: string;
  destinationCityName?: string;
  phrase?: string;
}
export interface ITranslationModel {
  translation: ITranslation[];
}
export type ITranslationDocumnet = Document &
  ITranslationModel &
  Record<string, unknown>;
