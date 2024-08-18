import { Schema } from 'mongoose';

const translationSchema: Schema = new Schema({
  language: String,
  destinationName: String,
  name: String,
  phrase: String,
  imageAlt: String,
  city: {
    language: String,
    name: String,
    country: {
      name: String,
      currency: {
        name: String
      }
    }
  },
  country: {
    name: String,
    currency: String
  },
  currency: {
    name: String
  }
});

export default translationSchema;
