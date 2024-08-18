import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import logger from '../configs/logger';
import redis from '../configs/cache';

const slowRateLimiter = new RateLimiterRedis({
  storeClient: redis,
  points: 50,
  duration: 60 * 60,
  execEvenly: false,
  blockDuration: 60 * 60,
  keyPrefix: 'middleware-slow',
  inmemoryBlockOnConsumed: 50
});

const fastRateLimiter = new RateLimiterRedis({
  storeClient: redis,
  points: 2,
  duration: 1,
  execEvenly: false,
  blockDuration: 60 * 60 * 12,
  keyPrefix: 'middleware-fast',
  inmemoryBlockOnConsumed: 2
});

export const slowRateLimiterMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  slowRateLimiter
    .consume(req.ip)
    .then(() => {
      next();
    })
    .catch((rejRes) => {
      if (rejRes instanceof Error) {
        logger.error(rejRes);
        res.status(500).send('Internal Server Error');
      } else {
        const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
        res.set('Retry-After', String(secs));
        res.status(429).send('Too Many Requests');
      }
    });
};

export const fastRateLimiterMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  fastRateLimiter
    .consume(req.ip)
    .then(() => {
      next();
    })
    .catch((rejRes) => {
      if (rejRes instanceof Error) {
        logger.error(rejRes);
        res.status(500).send('Internal Server Error');
      } else {
        const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
        res.set('Retry-After', String(secs));
        res.status(429).send('Too Many Requests');
      }
    });
};
