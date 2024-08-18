import { Schema, model } from 'mongoose';
import DepartmentDocument from '../interfaces/department.interface';

const departmentSchema: Schema = new Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  }
});

const Department = model<DepartmentDocument>('Department', departmentSchema);

export default Department;
