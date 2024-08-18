import { Document, PaginateModel } from 'mongoose';
import { ITranslation } from './translation.interface';

export interface ICountry extends Document {
  name: string;
  code: string;
  translation: [ITranslation];
  currency: any;
}

export interface ICountryModel extends PaginateModel<ICountry> {
  searchCountriesPipeline(searchWord: string): Promise<ICountry[]>;
}
