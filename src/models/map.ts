import { Schema, model } from 'mongoose';
import { IMap } from '../interfaces/map.interface';
import translationSchema from './translation';

const mapSchema = new Schema(
  {
    originName: String,
    originCode: String,
    destinationName: String,
    destinationCode: String,
    originCityName: String,
    originCityCode: String,
    destinationCityName: String,
    destinationCityCode: String,
    originLocation: {
      type: { type: String, default: 'Point' },
      coordinates: [Number]
    },
    destinationLocation: {
      type: { type: String, default: 'Point' },
      coordinates: [Number]
    },
    departure: String,
    return: String,
    tripType: String,
    tripClass: String,
    adults: Number,
    children: Number,
    infants: Number,
    filters: {
      prices: {
        min: Number,
        max: Number
      },
      stops: {
        direct: Number,
        oneStop: Number,
        moreThanOneStop: Number
      },
      durations: {
        min: Number,
        max: Number
      },
      airlines: [
        {
          code: String,
          amount: Number
        }
      ]
    },
    translation: [translationSchema]
  },
  {
    timestamps: true,
    versionKey: false
  }
);

const Map = model<IMap>('Map', mapSchema);

export default Map;
