import { Request, Response } from 'express';
import {
  flightTrackingPixel,
  hotelTrackingPixel,
  trainTrackingPixel,
  transferTrackingPixel
} from '../track';

export const flightsTrackingPixels = async (req: Request, res: Response) => {
  const image = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOwo=',
    'base64'
  );
  const { provider } = req.params;

  const { query } = req;

  const responseMsg = await flightTrackingPixel({
    provider,
    ...query
  });
  if (responseMsg.length > 0) res.status(429).json({ errMsg: responseMsg });
  else res.header('content-type', 'image/gif').send(image);
};

export const trainsTrackingPixels = async (req: Request, res: Response) => {
  const image = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOwo=',
    'base64'
  );
  const { provider } = req.params;

  const { query } = req;

  await trainTrackingPixel({
    provider,
    ...query
  });

  res.header('content-type', 'image/gif').send(image);
};

export const transfersTrackingPixels = async (req: Request, res: Response) => {
  const image = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOwo=',
    'base64'
  );
  const { provider } = req.params;

  const { query } = req;

  await transferTrackingPixel({
    provider,
    ...query
  });

  res.header('content-type', 'image/gif').send(image);
};

export const hotelsTrackingPixels = async (req: Request, res: Response) => {
  const image = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOwo=',
    'base64'
  );
  const { provider } = req.params;

  const { query } = req;

  const responseMsg = await hotelTrackingPixel({
    provider,
    ...query
  });
  if (responseMsg.length > 0) res.status(429).json({ errMsg: responseMsg });
  else res.header('content-type', 'image/gif').send(image);
};
