import { Document } from 'mongoose';

interface IImage extends Document {
  filename: string;
  mime: string;
  path: string;
  pathWithFilename: string;
  url?: string;
}

export default IImage;
