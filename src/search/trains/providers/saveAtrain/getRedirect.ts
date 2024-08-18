import querystring from 'querystring';

const getRedirect = (redirectId: string, redirectPayload: any) => {
  const query = {
    adult: redirectPayload.adults,
    youth: redirectPayload.children + redirectPayload.infants,
    senior: 0,
    result_page: true,
    language: redirectPayload.language,
    affiliate: 898
  };
  return `https://www.saveatrain.com/en?${querystring.stringify(query)}&${
    redirectPayload.outboundPayload
  }&${redirectPayload.inboundPayload}&redirectId=${redirectId}`;
};

export default getRedirect;
