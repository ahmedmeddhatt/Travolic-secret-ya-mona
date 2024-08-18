import { Schema, model } from 'mongoose';
import { IChainDocument } from '../interfaces/chain.interface';

const chainSchema: Schema = new Schema(
  {
    chain_id: String,
    chain_name: String
  },
  {
    collection: 'chains'
  }
);

const Chain = model<IChainDocument>('Chain', chainSchema);

export default Chain;
