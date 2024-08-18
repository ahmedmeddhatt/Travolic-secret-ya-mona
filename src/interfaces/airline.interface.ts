import { Document } from 'mongoose';

import { ITranslation } from './translation.interface';

interface IAirline extends Document {
  name: string;
  code: string;
  translation: ITranslation[];
  image: any;
}

export default IAirline;
