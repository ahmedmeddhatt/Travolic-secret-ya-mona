import { Document, Schema } from 'mongoose';
import { JobStatusEnum } from '../enums/job-status.enum';
import { JobTypeEnum } from '../enums/job-type.enum';

interface JobDocument extends Document {
  _id?: string;

  name: string;

  code: string;

  department?: Schema.Types.ObjectId;
  location?: Schema.Types.ObjectId;

  firstSalaryRange?: number;

  secondSalaryRange?: number;

  currency?: string;

  status: JobStatusEnum;

  type: JobTypeEnum;
}

export default JobDocument;
