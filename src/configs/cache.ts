import Redis from 'ioredis';
import logger from './logger';

const {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
  REDIS_SENTINEL,
  REDIS_SENTINEL_NAME
} = process.env;

const redis =
  REDIS_SENTINEL === 'true'
    ? new Redis({
        sentinels: [{ host: REDIS_HOST, port: parseInt(REDIS_PORT, 10) }],
        name: REDIS_SENTINEL_NAME,
        password: REDIS_PASSWORD
      })
    : REDIS_PASSWORD
    ? new Redis({
        host: REDIS_HOST,
        port: parseInt(REDIS_PORT, 10),
        password: REDIS_PASSWORD
      })
    : new Redis({
        host: REDIS_HOST,
        port: parseInt(REDIS_PORT, 10)
      });

redis.on('error', (err) => {
  logger.error(err);
});

redis.on('connect', () => {
  logger.info(`Redis connected on ${REDIS_HOST}:${REDIS_PORT}`);
});

export default redis;
