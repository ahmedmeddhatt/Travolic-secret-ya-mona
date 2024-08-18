import { Request, Response, NextFunction } from 'express';
import { MailerService } from '../services/mailer.service';
import {
  contactUsByEmailAuth,
  contactUsByEmailUnAuth
} from '../validators/contactUs.schema';
import AppError from '../utils/appError.util';

const { SUPPORT_EMAIL } = process.env;

export const contactUs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let contactUsMail: any = {};

  if (req.user) {
    const { error, value } = contactUsByEmailAuth.validate(req.body);
    const { message, subject } = value;
    const { email, firstName, lastName } = req.user;

    if (error) {
      return next(new AppError(error.details[0].message, 422));
    }

    contactUsMail = {
      from: email,
      fullName: `${firstName} ${lastName}`,
      message,
      subject
    };
  } else {
    const { error, value } = contactUsByEmailUnAuth.validate(req.body);
    const { from, fullName, message, subject } = value;

    if (error) {
      return next(new AppError(error.details[0].message, 422));
    }

    contactUsMail = { from, fullName, message, subject };
  }

  const mailer = new MailerService();
  const sent = await mailer.send({
    subject: 'Contact Us: ' + contactUsMail.subject,
    to: SUPPORT_EMAIL,
    text: `Contact Us message`,
    html: `<p>From:${contactUsMail.from}</p><p>${contactUsMail.fullName} sent you invitation to view travolic search result</p><p><h5>Message:</h5>${contactUsMail.message}</p>`
  });

  if (!sent) {
    return next(new AppError('Failed to send email', 500));
  }

  return res.status(200).json({ success: true });
};
