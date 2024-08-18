import { Schema, model, PaginateModel } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import mongooseAutoPopulate from 'mongoose-autopopulate';
import IAirport from '../interfaces/airport.interface';
import translationSchema from './translation';

const airportSchema: Schema = new Schema({
  name: String,
  code: String,
  timezone: String,
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number]
    }
  },
  city: {
    type: Schema.Types.ObjectId,
    ref: 'City',
    autopopulate: true
  },
  translation: [translationSchema],
  isActive: Boolean
});

airportSchema.plugin(paginate);
airportSchema.plugin(mongooseAutoPopulate);

airportSchema.index({ city: 1, name: 1, code: 1 });
airportSchema.index({ location: '2dsphere' });

const Airport = model<IAirport, PaginateModel<IAirport>>(
  'Airport',
  airportSchema
);

export default Airport;
