import * as mongoose from 'mongoose';

type MetropolitanAreaDocument = mongoose.Document & {
  name: string;
  code: string;
  city: mongoose.Schema.Types.ObjectId;
};

const metropolitanAreaSchema = new mongoose.Schema({
  name: {
    type: String,
    intl: true
  },
  code: {
    type: String,
    default: null
  },
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City'
  }
});

const MetropolitanArea = mongoose.model<MetropolitanAreaDocument>(
  'MetropolitanArea',
  metropolitanAreaSchema
);

export default MetropolitanArea;
