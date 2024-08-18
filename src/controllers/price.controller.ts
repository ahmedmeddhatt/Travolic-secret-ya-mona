import { Request, Response } from 'express';
import { getJSON } from '../utils/cache.util';
import UserAlerts from '../models/user-alert';

const { APP_FRONT_URL } = process.env;

export const priceAlert = async (req: Request, res: Response) => {
  const { requestId } = req.params;

  const results = await getJSON(`price-alert-${requestId}`);

  return res.status(200).json(results);
};

export const turnOffNotification = async (req: Request, res: Response) => {
  const { userId } = req.params;

  const data = await UserAlerts.updateOne(
    { userId },
    {
      active: false
    }
  );
  if (data) {
    return res.redirect(APP_FRONT_URL);
  } else {
    return res.redirect(`${APP_FRONT_URL}/404`);
  }
};

export const deleteSubscription = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const data = await UserAlerts.findOneAndDelete({
    userId
  });

  if (data) {
    return res.redirect(APP_FRONT_URL);
  } else {
    return res.redirect(`${APP_FRONT_URL}/404`);
  }
};
