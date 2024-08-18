import * as mongoose from 'mongoose';
import { Section } from '../enums/sections.enum';
import { TripType } from '../enums/trip-type.enum';
import paginate from 'mongoose-paginate-v2';

interface UserSearchDocument extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  searchOptions: SearchOptions;
  endpoint: string;
  method: string;
  type: string;
}

export const generateSearchSerial = (): number => {
  return Date.now();
};

const SearchOptionSchema = new mongoose.Schema({
  tripType: {
    type: String,
    enum: Object.values(TripType)
  },
  currency: String,
  country: String,
  language: String,
  legs: [
    {
      origin: String,
      destination: String,
      departure: String,
      time: String,
      start_lat: String,
      start_long: String,
      end_lat: String,
      end_long: String,
      origin_name: String,
      destination_name: String,
      from_type: String,
      to_type: String,
      des_from: String,
      des_to: String,
      arrival: String,
      originPlaceType: String,
      destinationPlaceType: String
    }
  ],
  adults: Number,
  children: Number,
  infants: Number,
  cabinClass: String,
  visitorId: String,
  requestId: String,
  userData: { ip: String, country_code: String }
});

export const schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    searchId: String,
    endpoint: String,
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE']
    },
    searchOptions: SearchOptionSchema,
    type: {
      type: String,
      enum: Object.values(Section)
    }
  },
  { timestamps: true, minimize: true }
);

schema.methods.generateSearchSerial = generateSearchSerial;
schema.plugin(paginate);

const UserSearch = mongoose.model<
  UserSearchDocument,
  mongoose.PaginateModel<UserSearchDocument>
>('UserSearch', schema);

export default UserSearch;
