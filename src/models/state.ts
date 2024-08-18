import { Schema, model } from 'mongoose';
import mongooseAutoPopulate from 'mongoose-autopopulate';
import IState from '../interfaces/state.interface';
import translationSchema from './translation';

export const stateSchema: Schema = new Schema({
  name: String,
  code: String,
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
  }
});

stateSchema.plugin(mongooseAutoPopulate);

export const State = model<IState>('State', stateSchema);
