import uuid from 'uuid';
import { decodeRedirectPayload } from '../../utils';
import providersHotel from './providers';

const track = async (
  redirectId: string,
  redirectPayload: RedirectPayload,
  options: any,
  language: string
) => {
  return {
    redirectId,
    redirectPayload,
    options,
    language
  };
};

const redirect = async (token: string, options: any, language: string) => {
  const redirectId: string = uuid.v4();
  const redirectPayload: RedirectPayload = decodeRedirectPayload(
    token
  ) as RedirectPayload;

  track(redirectId, redirectPayload, options, language);

  const { getRedirect } = providersHotel[redirectPayload.provider];

  if (getRedirect) {
    const redirectData = await getRedirect(redirectId, redirectPayload);
    return { url: redirectData.url };
  }

  if (redirectPayload.url) {
    return { url: redirectPayload.url };
  }

  return { url: '/' };
};

export default redirect;
