import { Schema, model, PaginateModel } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import mongooseAutoPopulate from 'mongoose-autopopulate';
import { ICityDocument } from '../interfaces/city.interface';
import translationSchema from './translation';

export const citySchema: Schema = new Schema({
  agoda_city_id: String,
  distribusion_code: String,
  name: String,
  code: String,
  imageAlt: String,
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number]
  },
  translation: [translationSchema],
  country: {
    type: Schema.Types.ObjectId,
    ref: 'Country',
    autopopulate: true
  },
  state: {
    type: Schema.Types.ObjectId,
    ref: 'State',
    autopopulate: true
  },
  image: {
    type: Schema.Types.ObjectId,
    ref: 'Image',
    autopopulate: true
  }
});

citySchema.plugin(mongooseAutoPopulate);
citySchema.plugin(paginate);

export const City = model<ICityDocument, PaginateModel<ICityDocument>>(
  'City',
  citySchema
);
