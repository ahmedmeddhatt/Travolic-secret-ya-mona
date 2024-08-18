import axios from 'axios';
import logger from '../../../../configs/logger';
const { AIRPAZ_DEEPLINK_URL, AIRPAZ_KEY } = process.env;

const getRedirect = async (redirectId, payload) => {
  const { flightData } = payload;
  const result = await axios
    .post(AIRPAZ_DEEPLINK_URL, flightData, {
      headers: {
        'Content-Type': 'application/json',
        'X-Affiliate-Key': AIRPAZ_KEY
      }
    })
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err.message);
    });
  return `${result['result']['redirectUrl']}&redirectID=${redirectId}`;
};

export default getRedirect;
