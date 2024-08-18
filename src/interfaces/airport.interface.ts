import { Document } from 'mongoose';
import { ITranslation } from './translation.interface';

interface AirportDocument extends Document {
  name: string;
  code: string;
  timezone: string;
  location: {
    type: string;
    coordinates: number[];
  };
  translation: [ITranslation];
  city: any;
  isActive: boolean;
}

export default AirportDocument;
