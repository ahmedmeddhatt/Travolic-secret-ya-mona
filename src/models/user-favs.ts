import { Schema, model, Document, PaginateModel } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import mongooseAutoPopulate from 'mongoose-autopopulate';
import { Section } from '../enums/sections.enum';
// import { TripType } from '../enums/trip-type.enum';

type UserFavouriteSearchResult = {
  itinerary: TransformedItinerary;
  airlines?: any;
  airports?: any;
};

interface UserFavouriteDocument extends Document {
  userId: Schema.Types.ObjectId | string;
  searchOptions: object;
  searchResult: UserFavouriteSearchResult;
  price: {
    amount: number;
    currency: string;
  };
  priceAlert: boolean;
  itineraryId: string;
}

// const SearchOptionSchema = new Schema({
//   tripType: {
//     type: String,
//     enum: Object.values(TripType)
//   },
//   currency: String,
//   country: String,
//   language: String,
//   legs: [
//     {
//       origin: String,
//       destination: String,
//       departure: String,
//       orig_city: Boolean,
//       dest_city: Boolean,
//       originPlaceType: String,
//       destinationPlaceType: String,
//       time: String,
//       start_lat: String,
//       start_long: String,
//       end_lat: String,
//       end_long: String,
//       origin_name: String,
//       destination_name: String,
//       from_type: String,
//       to_type: String,
//       des_from: String,
//       des_to: String,
//       arrival: String
//     }
//   ],
//   adults: Number,
//   children: Number,
//   infants: Number,
//   cabinClass: String,
//   visitorId: String
// });

const TransformedResultSchema = new Schema(
  {
    itinerary: {
      id: String,
      legs: [
        {
          id: String,
          origin: String,
          departure: String,
          destination: String,
          arrival: String,
          description: String,
          viehcle_type: String,
          model: String,
          make: String,
          class: String,
          time: String,
          max_passengers: Number,
          max_bags: Number,
          average_rating: Number,
          wait_time: Number,
          carImage_url: String,
          departure_time: String,
          free_cancellation: String,
          review_count: Number,
          review_score: Number,
          instruction_for_customer: String,
          supporter_providerName: String,
          segments: [
            {
              id: String,
              origin: String,
              departure: String,
              destination: String,
              arrival: String,
              marketingCarrier: String,
              operatingCarrier: String,
              marketingFlightNumber: String,
              duration: Number
            }
          ],
          stopCount: Number,
          marketingCarriers: [String],
          duration: Number,
          vehicleType: [String]
        }
      ],
      pricingOptions: {
        type: [
          {
            agent: String,
            agentName: String,
            price: {
              amount: Number,
              currency: String,
              person: Number,
              discount: Number
            },
            meta: {
              baggage: Schema.Types.Mixed,
              segments: [Schema.Types.Mixed],
              restrictions: Schema.Types.Mixed
            },
            deepLink: String
          }
        ]
      }
    },
    airlines: Schema.Types.Mixed,
    airports: Schema.Types.Mixed
  },
  { _id: false, timestamps: true }
);

const userFavouritesSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    searchOptions: {
      type: Object,
      required: true
    },
    searchResult: {
      type: TransformedResultSchema,
      required: true
    },
    price: {
      amount: Number,
      currency: String
    },
    priceAlert: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      enum: Object.values(Section),
      required: true
    },
    itineraryId: {
      type: String,
      required: true
    }
  },
  { timestamps: true, minimize: true }
);

userFavouritesSchema.plugin(paginate);
userFavouritesSchema.plugin(mongooseAutoPopulate);

const UserFavourites = model<
  UserFavouriteDocument,
  PaginateModel<UserFavouriteDocument>
>('UserFavourites', userFavouritesSchema);

export default UserFavourites;
