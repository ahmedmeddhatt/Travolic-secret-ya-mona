import logger from '../../../../configs/logger';

const getRedirect = async (redirectId, payload) => {
  const { url } = payload;
  const data = await fetch(url, {
    method: 'POST'
  })
    .then((res) => res.json())
    .catch((err) => {
      logger.error(err);
      return {};
    });

  return `http://12go.asia/en/checkout/${data}?z=3985010`;
};

export default getRedirect;
