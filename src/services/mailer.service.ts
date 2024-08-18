import sgMail from '@sendgrid/mail';
import { EmailProviderInterface } from '../interfaces/email-provider.interface';
import logger from '../configs/logger';

const { SENDGRID_API_KEY, SENDGRID_FROM_EMAIL } = process.env;

sgMail.setApiKey(SENDGRID_API_KEY);

export class MailerService implements EmailProviderInterface {
  private client;

  constructor() {
    this.client = sgMail.setApiKey(SENDGRID_API_KEY);
  }
  async send(options: SendEmailDto) {
    try {
      const msg = {
        from: SENDGRID_FROM_EMAIL,
        ...options,
        trackingSettings: {
          clickTracking: {
            enable: false,
            enableText: false
          },
          openTracking: {
            enable: false
          }
        }
      };
      await sgMail.send(msg);
      return true;
    } catch (e) {
      logger.error(JSON.stringify(e));
      const mailerError = new Error(JSON.stringify(e));
      mailerError.name = 'MailerError';
      mailerError.stack = e.stack;
      throw mailerError;
    }
  }
}
