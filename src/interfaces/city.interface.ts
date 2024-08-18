import { Document } from 'mongoose';
import { ITranslation } from './translation.interface';

export interface ICityTranslation extends ITranslation {
  imageAlt: string;
}

export interface ICityDocument extends Document {
  agoda_city_id: string;
  distribusion_code: string;
  name: string;
  imageAlt: string;
  code: string;
  location: {
    type: string;
    coordinates: number[];
  };
  translation: [ICityTranslation];
  country: any;
  state: any;
  images: string[];
  image: any;
}
//test
