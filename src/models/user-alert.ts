import { Schema, model, Document, PaginateModel } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import mongooseAutoPopulate from 'mongoose-autopopulate';
import { Section } from '../enums/sections.enum';
import { TripType } from '../enums/trip-type.enum';

interface UserAlertDocument extends Document {
  userId: Schema.Types.ObjectId | string;
  searchOptions: SearchOptions;
  price: {
    amount: number;
    currency: string;
  };
  active: boolean;
}
const SearchOptionSchema = new Schema({
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
      orig_city: Boolean,
      dest_city: Boolean,
      originPlaceType: String,
      destinationPlaceType: String,
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
      arrival: String
    }
  ],
  adults: Number,
  children: Number,
  infants: Number,
  cabinClass: String,
  visitorId: String
});
const userAlertSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    searchOptions: {
      type: SearchOptionSchema,
      required: true
    },
    price: {
      amount: Number,
      currency: String
    },
    active: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      enum: Object.values(Section),
      required: true
    }
  },
  { timestamps: true, minimize: true }
);

userAlertSchema.plugin(paginate);
userAlertSchema.plugin(mongooseAutoPopulate);

const UserAlerts = model<UserAlertDocument, PaginateModel<UserAlertDocument>>(
  'UserAlerts',
  userAlertSchema
);

export default UserAlerts;
