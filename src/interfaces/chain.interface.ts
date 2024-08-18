import { Document } from 'mongoose';

export interface IChainDocument extends Document {
  chain_id: string;
  chain_name: string;
}
