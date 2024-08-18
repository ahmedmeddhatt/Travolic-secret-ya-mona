import { supportedCountry } from './pos';

const getRedirect = async (redirectId, payload) => {
  const { LOL_TRACKING_ID, NODE_ENV } = process.env;
  if (!supportedCountry.includes(payload.country)) {
    payload.country = 'US';
  }
  const { termUrl } = payload;
  const lolURL = `https://www.lol.travel/${payload.country.toLowerCase()}/meta/flight/results?${termUrl}`;
  const redirectURL = `https://h.lol.travel/TrackIt?tid=${LOL_TRACKING_ID}&url=${lolURL}&cs_redirectID=${redirectId}`;

  return NODE_ENV === 'dev' ? lolURL : redirectURL;
};

export default getRedirect;
