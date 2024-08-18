import qs from 'querystring';

const { TRAVOFY_DEEPLINK } = process.env;

async function getRedirect(redirectId, payload) {
  const { flightSearchKey, flightKey, currency } = payload;
  const query = {
    product: 'airmeta',
    currency,
    fltref: flightSearchKey,
    fltid: flightKey,
    utm_source: 'meta_toc_flight',
    utm_campaign: 'toc_flight_core',
    utm_medium: '31',
    redirectID: redirectId
  };

  return `${TRAVOFY_DEEPLINK}?${qs.stringify(query)}`;
}

export default getRedirect;
