import axios from 'axios';
import moment from 'moment';
import querystring from 'query-string';

const cabinClassMap: IDictionary<string> = {
  Economy: 'M',
  Premium_Economy: 'W',
  First: 'F',
  Business: 'C'
};

const search = async (input: SearchTrainOptions) => {
  if (input.tripType === 'multi') {
    return {};
  }
  const originCoords = input.origin.location.coordinates;
  const destinationCoords = input.destination.location.coordinates;

  if (originCoords === null || destinationCoords === null) {
    return {};
  }

  const payload = {
    fly_from: `${originCoords[1].toFixed(4)}-${originCoords[0].toFixed(4)}-3km`,
    fly_to: `${destinationCoords[1].toFixed(4)}-${destinationCoords[0].toFixed(
      4
    )}-3km`,
    date_from: moment.utc(input.legs[0].departure).format('DD/MM/YYYY'),
    date_to: moment.utc(input.legs[0].departure).format('DD/MM/YYYY'),
    flight_type: input.tripType,
    adults: input.adults,
    children: input.children,
    infants: input.infants,
    selected_cabins: cabinClassMap[input.cabinClass],
    vehicle_type: 'train',
    curr: input.currency,
    locale: input.language,
    return_from: undefined,
    return_to: undefined
  };

  if (input.tripType == 'round') {
    payload.return_from = moment
      .utc(input.legs[1].departure)
      .format('DD/MM/YYYY');
    payload.return_to = moment
      .utc(input.legs[1].departure)
      .format('DD/MM/YYYY');
  }

  const url =
    'https://tequila-api.kiwi.com/v2/search?' + querystring.stringify(payload);

  const data = await axios
    .get(url, {
      headers: {
        'content-type': 'application/json',
        apikey: 'm8dcJMH9DzC6E9GTTdNgtlA8Wu9bp9li'
      }
    })
    .then((res) => res.data)
    .catch(() => {
      return {};
    });

  return data;
};
export default search;
