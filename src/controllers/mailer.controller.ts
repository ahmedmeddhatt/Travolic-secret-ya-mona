import { Request, Response, NextFunction } from 'express';
import { MailerService } from '../services/mailer.service';
import { MailValidator } from '../validators/sendMail.schema';
import AppError from '../utils/appError.util';

export const mailer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = MailValidator.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const options: SendEmailDto = value;
  const mailer = new MailerService();

  const sendResponse = await mailer.send(options);
  return res.json({ sent: sendResponse });
};
