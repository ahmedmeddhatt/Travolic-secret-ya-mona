import { Request, Response, NextFunction } from 'express';

const disabledRoutes = process.env.DISABLED_ROUTES
  ? process.env.DISABLED_ROUTES.split(',')
  : [];

const disableRoutes = (req: Request, res: Response, next: NextFunction) => {
  if (disabledRoutes.includes(req.path)) {
    res.status(500).send({
      status: 'fail',
      message: 'Something went wrong'
    });
  } else {
    next();
  }
};

export default disableRoutes;
