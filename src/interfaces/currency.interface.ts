import { Document, PaginateModel } from 'mongoose';
import { ITranslation } from './translation.interface';

export interface ICurrencyDocument extends Document {
  code: string;
  symbol: string;
  name: string;
  translation: [ITranslation];
}

export interface ICurrencyModel extends PaginateModel<ICurrencyDocument> {
  searchCurrenciesPipeline(searchWord: string): Promise<ICurrencyDocument[]>;
}
