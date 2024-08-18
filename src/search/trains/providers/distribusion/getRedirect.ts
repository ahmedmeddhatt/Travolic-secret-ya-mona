import querystring from 'querystring';

const getRedirect = (redirectId: string, redirectPayload: any) => {
  const query = {
    retailer_partner_number: 623853,
    currency: redirectPayload.currency,
    locale: redirectPayload.language,
    pax:
      redirectPayload.adults +
      redirectPayload.children +
      redirectPayload.infants
  };
  return `https://tickets.distribusion.com/vx/bookings/new?${querystring.stringify(
    query
  )}&${redirectPayload.outboundPayload}&${redirectPayload.inboundPayload}`;
};

export default getRedirect;
