import { Request, Response, NextFunction } from 'express';
import { Job, Department, Location } from '../models';
import { jobSchema } from '../validators/job.schema';
import AppError from '../utils/appError.util';

export const addJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = jobSchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const department = await Department.findOne({ _id: value.department });

  if (!department) {
    return next(new AppError('Department not found', 404));
  }

  if (value.location) {
    const location = await Location.findOne({ _id: value.location });

    if (!location) {
      return next(new AppError('Location not found', 404));
    }
  }

  const job = await Job.create(value);

  return res.status(201).json(job);
};

export const getAllJobs = async (req: Request, res: Response) => {
  const { remote, page: pageQuery, limit: limitQuery, ...filter } = req.query;

  if (filter.name) {
    filter.name = { $regex: filter.name, $options: 'i' };
  }

  if (remote == 'true') {
    filter.location = { $eq: null };
  }

  let jobs: any = '';

  if (pageQuery && limitQuery) {
    const page = parseInt(pageQuery as string);
    const limit = parseInt(limitQuery as string);
    jobs = await Job.find(filter)
      .populate([
        { model: 'Location', path: 'location' },
        { model: 'Department', path: 'department' }
      ])
      .limit(limit)
      .skip(page - 1);

    const jobsCount = await Job.count(filter);
    const pageCount = Math.ceil(jobsCount / limit);

    return res.status(200).json({ jobs, page, pageCount, limit });
  }

  jobs = await Job.find(filter).populate([
    { model: 'Location', path: 'location' },
    { model: 'Department', path: 'department' }
  ]);

  return res.status(200).json({ jobs });
};
