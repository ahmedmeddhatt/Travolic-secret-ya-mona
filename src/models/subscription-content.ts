import * as mongoose from 'mongoose';

type SubscriptionContentDocument = mongoose.Document & {
  text: string;
  html?: string;
};

const subscriptionContentSchema = new mongoose.Schema(
  {
    text: { required: true, type: String },
    html: String
  },
  { timestamps: true, minimize: true }
);

const SubscriptionContent = mongoose.model<SubscriptionContentDocument>(
  'SubscriptionContent',
  subscriptionContentSchema
);

export default SubscriptionContent;
