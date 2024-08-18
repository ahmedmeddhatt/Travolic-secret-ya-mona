import { Schema, model } from 'mongoose';
import LocationDocument from '../interfaces/location.interface';

const translationSchema: Schema = new Schema({
  language: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  }
});

const locationSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  translation: [translationSchema]
});

const Location = model<LocationDocument>('Location', locationSchema);

export default Location;
