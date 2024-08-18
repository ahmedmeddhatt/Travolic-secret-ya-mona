import { Client } from '@elastic/elasticsearch';
import logger from './logger';

const {
  ELASTICSEARCH_CLOUD_ID,
  ELASTICSEARCH_CLOUD,
  ELASTICSEARCH_URL,
  ELASITCSEARCH_TRACKING_ENABLED,
  ELASTICSEARCH_USERNAME,
  ELASTICSEARCH_PASSWORD
} = process.env;

let client: Client | null = null;

if (ELASITCSEARCH_TRACKING_ENABLED === 'true') {
  client =
    ELASTICSEARCH_CLOUD === 'true'
      ? new Client({
          cloud: {
            id: ELASTICSEARCH_CLOUD_ID
          },
          auth: {
            username: ELASTICSEARCH_USERNAME,
            password: ELASTICSEARCH_PASSWORD
          }
        })
      : new Client({
          node: ELASTICSEARCH_URL,
          auth: {
            username: ELASTICSEARCH_USERNAME,
            password: ELASTICSEARCH_PASSWORD
          }
        });
}

client
  .ping()
  .then(() => logger.info('You are connected to Elasticsearch!'))
  .catch(() => logger.error('Elasticsearch is not connected.'));

export default client;
