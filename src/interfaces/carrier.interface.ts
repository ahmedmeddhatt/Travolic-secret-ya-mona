import { Document } from 'mongoose';

interface ICarrier extends Document {
  code: string;
  name: string;
  translation: any[];
}

export default ICarrier;
