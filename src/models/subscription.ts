import * as mongoose from 'mongoose';

type SubscriptionDocument = mongoose.Document & {
  userId?: mongoose.Schema.Types.ObjectId;
  email: string;
};

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    name: String
  },
  { timestamps: true, minimize: true }
);

const Subscription = mongoose.model<SubscriptionDocument>(
  'Subscription',
  subscriptionSchema
);

export default Subscription;
