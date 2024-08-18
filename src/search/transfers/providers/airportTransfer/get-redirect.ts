import axios from 'axios';
const { API_KEY_AIRPORT_TRANSFERS } = process.env;

const getRedirect = async (redirectId, payload) => {
  const url = 'https://api.airporttransfer.com/api/partner/pre-booking';

  const result = await axios
    .post(url, payload, {
      headers: {
        'X-Api-Key': API_KEY_AIRPORT_TRANSFERS
      }
    })
    .then((res) => res.data)
    .catch((err) => {
      return err;
    });

  return `${result['data']['redirect_link']}&redirectID=${redirectId}`;
};

export default getRedirect;
