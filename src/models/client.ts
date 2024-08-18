import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  apiKey: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }
});

const Client = mongoose.model('Client', clientSchema);

export default Client;
