import { Schema, model, PaginateModel } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import mongooseAutoPopulate from 'mongoose-autopopulate';
import { IMobileUpdateDocument } from '../interfaces/mobile-update.interface';

export const mobileUpdateSchema: Schema = new Schema({
  platform: String,
  buildNumber: String,
  appVersion: String,
  hasUpdate: Boolean,
  mustUpdate: Boolean
});

mobileUpdateSchema.plugin(mongooseAutoPopulate);
mobileUpdateSchema.plugin(paginate);

export const MobileUpdate = model<
  IMobileUpdateDocument,
  PaginateModel<IMobileUpdateDocument>
>('MobileUpdate', mobileUpdateSchema);
