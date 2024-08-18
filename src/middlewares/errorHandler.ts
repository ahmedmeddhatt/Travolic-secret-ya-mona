const sendErrorDev = async (err, req, res) =>
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: `${err.message}`,
    stack: err.stack
  });

const sendErrorProd = async (req, res, err) => {
  return res.status(500).json({
    status: 'error',
    message: `${err.message}`
  });
};

export default (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'dev') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'prod') {
    sendErrorProd(req, res, err);
  }
  next();
};
