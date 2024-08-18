import { Schema, model, PaginateModel } from 'mongoose';
import mongooseAutoPopulate from 'mongoose-autopopulate';

type StationDocument = Document & {
  name: string;
  code: string;
  timezone: string;
  description: string;
  address: string;
  location: {
    type: string;
    coordinates: number[];
  };
  kiwi_code: string;
  type: string;
  distribusion_code: string;
  saveatrain_code: string;
  isActive: boolean;
  city: any;
  translation: {
    language: string;
    name: string;
    description: string;
  }[];
};

const stationSchema = new Schema({
  name: String,
  code: String,
  description: String,
  address: String,
  kiwi_code: String,
  distribusion_code: String,
  combigo_code: String,
  omio_code: String,
  saveatrain_code: String,
  kombo_code: String,
  timezone: String,
  type: String,
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: [Number]
  },
  isActive: Boolean,
  city: {
    type: Schema.Types.ObjectId,
    ref: 'City',
    autopopulate: true
  },
  translation: [
    {
      language: String,
      name: String,
      description: String
    }
  ]
});

stationSchema.plugin(mongooseAutoPopulate);

const Station = model<StationDocument, PaginateModel<StationDocument>>(
  'Station',
  stationSchema
);

export default Station;
