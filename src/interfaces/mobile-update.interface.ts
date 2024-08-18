import { Document } from 'mongoose';

export interface IMobileUpdateDocument extends Document {
  platform: string;
  buildNumber: string;
  appVersion: string;
  hasUpdate: boolean;
  mustUpdate: boolean;
}
