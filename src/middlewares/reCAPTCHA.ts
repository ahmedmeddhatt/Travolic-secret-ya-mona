import axios from 'axios';
import { NextFunction, Request, Response } from 'express';
import { recaptchaFailure } from '../track/failure/recaptchaFailure';
import moment from 'moment';

const reCAPTCHA = async (req: Request, res: Response, next: NextFunction) => {
  const { GOOGLE_RECAPTCHA_SECRET_KEY } = process.env;
  const token = req.headers['g-recaptcha-response'];

  if (!token) {
    return res.status(400).json({
      status: 'fail',
      message: 'Please enter reCAPTCHA token'
    });
  }

  const url = `https://www.google.com/recaptcha/api/siteverify?secret=${GOOGLE_RECAPTCHA_SECRET_KEY}&response=${token}&remoteip=${req.ip}`;

  const response = await axios.post(url);

  const { success, score } = response.data;

  if (!success) {
    return res.status(400).json({
      status: 'fail',
      message: 'reCAPTCHA token is invalid.'
    });
  } else if (score < 0.5) {
    await recaptchaFailure({
      ip: req.ip,
      visitorId: req.body.visitorId,
      score,
      timestamp: moment.utc().format()
    });
    return res.status(400).json({
      status: 'fail',
      message: 'You are not human.'
    });
  }

  return next();
};

export default reCAPTCHA;
