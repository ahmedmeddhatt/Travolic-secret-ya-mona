import axios from 'axios';
import logger from '../../../../configs/logger';

const getRedirect = async (redirectId, payload) => {
  try {
    const { searchId, termUrl } = payload;

    const result = await axios(
      `http://api.travelpayouts.com/v1/flight_searches/${searchId}/clicks/${termUrl}.json`
    )
      .then((res) => res.data)
      .catch((err) => {
        logger.error(err);
      });

    return `${result.url}`;
  } catch (err) {
    logger.error(err);
  }
};

export default getRedirect;
