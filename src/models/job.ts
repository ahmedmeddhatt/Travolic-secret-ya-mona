import { Schema, model } from 'mongoose';
import JobDocument from '../interfaces/job.interface';
import { JobStatusEnum } from '../enums/job-status.enum';
import { JobTypeEnum } from '../enums/job-type.enum';

const jobSchema: Schema = new Schema({
  name: {
    type: String,
    required: true
  },
  department: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Department'
  },
  location: {
    type: Schema.Types.ObjectId,
    ref: 'Location'
  },
  firstSalaryRange: {
    type: Number,
    required: true
  },
  secondSalaryRange: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(JobStatusEnum),
    required: true
  },
  type: {
    type: String,
    enum: Object.values(JobTypeEnum)
  }
});

const Job = model<JobDocument>('Job', jobSchema);

export default Job;
