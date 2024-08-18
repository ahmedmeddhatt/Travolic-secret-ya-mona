import { Schema, model, PaginateModel } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import mongooseAutoPopulate from 'mongoose-autopopulate';
import IaircarftDB from '../interfaces/aircarftDB.interface';

const aircraftDBSchema = new Schema({
  icao_codes: String,
  iata_codes: String,
  group_name: String,
  subgroup_name: String,
  is_wide_body: String
});

aircraftDBSchema.plugin(paginate);
aircraftDBSchema.plugin(mongooseAutoPopulate);

aircraftDBSchema.index({ icao_codes: 1, iata_codes: 1, group_name: 1 });

export const AircraftDB = model<IaircarftDB, PaginateModel<IaircarftDB>>(
  'aircrafts_db',
  aircraftDBSchema
);
