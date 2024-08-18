import { Schema, model } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import mongooseAutoPopulate from 'mongoose-autopopulate';
import { ICountry, ICountryModel } from '../interfaces/country.interface';
import translationSchema from './translation';

export const countrySchema = new Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    default: null
  },
  currency: {
    type: Schema.Types.ObjectId,
    ref: 'Currency',
    autopopulate: true
  },
  translation: [translationSchema]
});

countrySchema.plugin(paginate);
countrySchema.plugin(mongooseAutoPopulate);

export const Country = model<ICountry, ICountryModel>('Country', countrySchema);
