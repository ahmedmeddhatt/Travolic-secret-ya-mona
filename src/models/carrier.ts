import { Schema, model } from 'mongoose';
import mongooseAutoPopulate from 'mongoose-autopopulate';
import ICarrier from '../interfaces/carrier.interface';
import translationSchema from './translation';

const carrierSchema = new Schema({
  code: String,
  name: String,
  kiwi_code: String,
  distribusion_code: String,
  combigo_code: String,
  omio_code: String,
  saveatrain_code: String,
  kombo_code: String,
  translation: [translationSchema],
  image: {
    type: Schema.Types.ObjectId,
    ref: 'Image',
    autopopulate: true
  }
});

carrierSchema.plugin(mongooseAutoPopulate);

const Carrier = model<ICarrier>('carrier', carrierSchema);

export default Carrier;
