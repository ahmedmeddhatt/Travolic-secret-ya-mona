import { createLogger, transports, format } from 'winston';

const loggerDDErrorFormatter = (info) => {
  if (info instanceof Error) {
    const { stack, name, message, ...restInfo } = info;
    return {
      ...restInfo,
      message: info.message || 'test',
      error: {
        kind: name,
        stack,
        name,
        message
      }
    };
  }
  if (info.error instanceof Error) {
    const { error } = info;
    return {
      ...info,
      error: {
        ...error,
        kind: error.name,
        stack: error.stack
      }
    };
  }
  return info;
};

export default createLogger({
  format: format.combine(
    format(loggerDDErrorFormatter)(),
    format.timestamp(),
    format.json()
  ),
  transports: [new transports.Console()]
});
