import { Document } from 'mongoose';

interface LocationDocument extends Document {
  name: string;
  code: string;
}

export default LocationDocument;
