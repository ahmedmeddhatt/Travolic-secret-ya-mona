import { Schema, model } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import {
  ICurrencyDocument,
  ICurrencyModel
} from '../interfaces/currency.interface';
import translationSchema from './translation';

export const currencySchema = new Schema({
  code: {
    type: String
  },
  symbol: {
    type: String
  },
  name: {
    type: String
  },
  translation: [translationSchema]
});

currencySchema.plugin(paginate);

export const Currency = model<ICurrencyDocument, ICurrencyModel>(
  'Currency',
  currencySchema
);
