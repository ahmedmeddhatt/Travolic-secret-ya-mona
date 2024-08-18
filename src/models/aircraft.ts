import mongoose from 'mongoose';
import Iaircarft from '../interfaces/aircarft.interface';

const AircraftSchema = new mongoose.Schema({
  type: String,
  model: String
});

export const Aircraft = mongoose.model<Iaircarft>('aircrafts', AircraftSchema);
