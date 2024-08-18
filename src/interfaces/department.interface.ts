import { Document } from 'mongoose';

interface DepartmentDocument extends Document {
  name: string;
  code: string;
}

export default DepartmentDocument;
