import apm from 'elastic-apm-node';
import logger from './logger';

const { NODE_ENV, ELASTIC_APM_TOKEN, ELASTIC_APM_URL, ELASTIC_APM_ENABLED } =
  process.env;

if (ELASTIC_APM_ENABLED === 'true') {
  apm.start({
    serviceName: 'internal-api',
    secretToken: ELASTIC_APM_TOKEN,
    serverUrl: ELASTIC_APM_URL,
    environment: NODE_ENV,
    captureBody: 'errors',
    captureHeaders: true,
    captureSpanStackTraces: true,
    spanCompressionEnabled: true
  });

  logger.info(`Elastic APM started with NODE_ENV: ${NODE_ENV}`);
}

export default apm;
