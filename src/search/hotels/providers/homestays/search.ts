import axios from 'axios';
import moment from 'moment';
import querystring from 'query-string';
const { HOMESTAY_API_URL } = process.env;

const search = async (input: SearchHotelOptions) => {
  const arrival_date = moment(input.checkIn).format('YYYY-MM-DD');
  const departure_date = moment(input.checkOut).format('YYYY-MM-DD');
  const guests = input.adults;
  const country_code = input.countryCode;
  const currency_code = input.currency;
  const paylaod = {
    arrival_date,
    departure_date,
    guests,
    country_code,
    currency_code
  };

  try {
    const results = await axios.get(
      `${HOMESTAY_API_URL}?${querystring.stringify(
        paylaod
      )}&room_totals=true&order=best_match`
    );
    return results.data;
  } catch (err) {
    return {};
  }
};
export default search;
