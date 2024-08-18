import { Router } from 'express';

import {
  addDepartment,
  getAllDepartments
} from '../controllers/department.controller';
import {
  addLocation,
  getAllLocations
} from '../controllers/location.controller';
import { addJob, getAllJobs } from '../controllers/job.controller';

const jobsEndpoint = (app: Router) => {
  app.route('/department').post(addDepartment).get(getAllDepartments);

  app.route('/location').post(addLocation).get(getAllLocations);

  app.route('/job').post(addJob).get(getAllJobs);

  return app;
};

export default jobsEndpoint;
