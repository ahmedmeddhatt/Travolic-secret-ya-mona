import redis from '../configs/cache';
import { createFunctionArgsSignature } from '.';

const getJSON = async (key: string) => {
  if (!redis) {
    return null;
  }
  const value = await redis.get(key);
  return JSON.parse(value);
};

const getMultiKeys = async (keys: string[]) => {
  if (!redis) {
    return null;
  }

  const values = await redis.mget(keys);

  return values.map((value) => JSON.parse(value));
};

const setJSON = (key: string, value: any, cacheOptions: CacheOptions) => {
  if (!redis) {
    return null;
  }
  const EX = cacheOptions.duration.as('seconds');
  redis.set(key, JSON.stringify(value), 'EX', EX);
};

const wrapFunction = (
  fn: (...args: any) => any,
  cacheOptions: CacheOptions
) => {
  return async (...args: any[]) => {
    const key = `${cacheOptions.prefix || ''}${fn.name}${
      cacheOptions.args ? '#' + createFunctionArgsSignature(args) : ''
    }`;

    const fromCache = await getJSON(key);

    if (fromCache) {
      return fromCache;
    }

    const functionResult = fn(...args);

    const newValue = await functionResult;

    setJSON(key, newValue, cacheOptions);

    return newValue;
  };
};

const getTTL = (key: string) => {
  if (!redis) {
    return null;
  }
  return redis.ttl(key);
};

export { getJSON, getMultiKeys, setJSON, wrapFunction, getTTL };
