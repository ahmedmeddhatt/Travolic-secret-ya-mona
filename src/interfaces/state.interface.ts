import { Document } from 'mongoose';
import { ITranslation } from './translation.interface';

interface StateDocument extends Document {
  name: string;
  code: string;
  location: {
    type: string;
    coordinates: number[];
  };
  translation: [ITranslation];
  country: any;
}

export default StateDocument;
