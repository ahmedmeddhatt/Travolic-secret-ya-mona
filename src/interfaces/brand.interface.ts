import { Document } from 'mongoose';

export interface IBrandDocument extends Document {
  brand_id: string;
  brand_name: string;
}
