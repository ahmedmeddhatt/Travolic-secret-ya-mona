import axios from 'axios';
import queryString from 'querystring';

const { TRANSAVIA_API_SEARCH_URL, TRANSAVIA_API_KEY } = process.env;

const search = async (options: SearchOptions) => {
  if (options.tripType === 'multi') return {};
  const params = {
    origin: options.legs[0].origin,
    destination: options.legs[0].destination,
    originDepartureDate: options.legs[0].departure.replace(/-/g, ''),
    adults: options.adults,
    children: options.children,
    infants: options.infants
  };

  if (options.tripType === 'round') {
    params['destinationDepartureDate'] = options.legs[1].departure.replace(
      /-/g,
      ''
    );
  }

  const parsedParams = `?${queryString.stringify(params)}`;
  const traseviaSearchEndpoint = `${TRANSAVIA_API_SEARCH_URL}${parsedParams}`;
  const response = await axios.get(traseviaSearchEndpoint, {
    headers: {
      apikey: TRANSAVIA_API_KEY
    }
  });

  if (response.status === 204) return {};

  return response.data;
};

export default search;
