import { Schema, model } from 'mongoose';
import IImage from '../interfaces/image.interface';

export const imageSchema = new Schema(
  {
    pathWithFilename: String,
    mime: String,
    filename: String,
    path: String
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    }
  }
);

imageSchema.virtual('url').get(function () {
  return `${process.env.GCLOUD_STORAGE_PUBLIC_URL}/${process.env.GCLOUD_STORAGE_BUCKET}/${this.pathWithFilename}`;
});

export const Image = model<IImage>('Image', imageSchema);
