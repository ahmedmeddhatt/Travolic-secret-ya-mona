import { Schema, model, PaginateModel } from 'mongoose';
import { IHotelDocument } from '../interfaces/hotel.interface';
import mongooseAutoPopulate from 'mongoose-autopopulate';

const hotelSchema: Schema = new Schema(
  {
    hotel_id: String,
    getaroom_id: String,
    chain_id: String,
    chain_name: String,
    chain: {
      type: Schema.Types.ObjectId,
      ref: 'Chain',
      autopopulate: true
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: 'Brand'
    },
    brand_id: String,
    brand_name: String,
    hotel_name: String,
    hotel_formerly_name: String,
    hotel_translated_name: String,
    addresses: [String],
    addressline1: String,
    addressline2: String,
    zipcode: String,
    state: String,
    countryisocode: String,
    star_rating: String,
    longitude: String,
    latitude: String,
    // location: {
    //   type: {
    //     type: String,
    //     enum: ['Point'],
    //     default: 'Point'
    //   },
    //   coordinates: [Number]
    // },
    url: String,
    checkin: String,
    checkout: String,
    numberrooms: String,
    numberfloors: String,
    yearopened: String,
    yearrenovated: String,
    photos: [String],
    photo1: String,
    photo2: String,
    photo3: String,
    photo4: String,
    photo5: String,
    overview: String,
    rates_from: String,
    continent_id: String,
    continent_name: String,
    city_id: String,
    country_id: String,
    number_of_reviews: String,
    rating_average: String,
    rates_currency: String,
    rates_from_exclusive: String,
    accommodation_type: String,
    city_ref: {
      type: Schema.Types.ObjectId,
      ref: 'City'
    },
    //new
    name: {
      type: String
    },
    images: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Image',
        autopopulate: true
      }
    ],
    description: {
      type: Object
    },
    city: {
      type: Schema.Types.ObjectId,
      ref: 'City',
      autopopulate: true
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
      type: Date
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

    translation: {
      type: Object
    },
    airports: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Airport',
        autopopulate: true
      }
    ]
  },
  {
    collection: 'hotels'
  }
);
hotelSchema.plugin(mongooseAutoPopulate);

const Hotel = model<IHotelDocument, PaginateModel<IHotelDocument>>(
  'Hotel',
  hotelSchema
);

export default Hotel;
