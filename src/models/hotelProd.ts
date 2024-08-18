import { Schema, model } from 'mongoose';
import mongooseAutoPopulate from 'mongoose-autopopulate';
import { IHotels } from '../interfaces/hotel.interface';

const hotelSchema = new Schema({
  name: {
    type: String
  },
  images: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Image'
    }
  ],
  description: {
    type: Object
  },
  city: {
    type: Schema.Types.ObjectId,
    ref: 'City'
  },
  country: {
    type: Schema.Types.ObjectId,
    ref: 'Country'
  },
  address: {
    type: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number]
    }
  },
  giataId: {
    type: String
  },
  lastUpdate: {
    type: String
  },
  ratings: {
    type: Number,
    default: 0
  },
  phone: {
    type: String
  },
  email: {
    type: String
  },
  urls: [
    {
      type: String
    }
  ],
  providerCodes: {
    type: Object
  },
  chain: {
    type: Schema.Types.ObjectId,
    ref: 'Chain'
  },
  translation: {
    type: Object
  },
  airports: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Airport'
    }
  ]
});

hotelSchema.plugin(mongooseAutoPopulate);

const HotelProd = model<IHotels>('HotelProd', hotelSchema);

export default HotelProd;
