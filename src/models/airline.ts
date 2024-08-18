import { model, Schema, PaginateModel } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import mongooseAutoPopulate from 'mongoose-autopopulate';
import IAirline from '../interfaces/airline.interface';
import translationSchema from './translation';

const airlineSchema: Schema = new Schema({
  name: String,
  code: String,
  translation: [translationSchema],
  image: {
    type: Schema.Types.ObjectId,
    ref: 'Image',
    autopopulate: true
  }
});

airlineSchema.plugin(paginate);
airlineSchema.plugin(mongooseAutoPopulate);

const Airline = model<IAirline, PaginateModel<IAirline>>(
  'Airline',
  airlineSchema
);

export default Airline;
