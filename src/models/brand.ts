import { Schema, model } from 'mongoose';
import { IBrandDocument } from '../interfaces/brand.interface';

const brandSchema: Schema = new Schema(
  {
    brand_id: String,
    brand_name: String
  },
  {
    collection: 'brands'
  }
);

const Brand = model<IBrandDocument>('Brand', brandSchema);

export default Brand;
