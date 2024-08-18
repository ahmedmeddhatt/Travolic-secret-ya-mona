import axios from 'axios';
import moment from 'moment';
import logger from '../../../../configs/logger';

const search = async (input: SearchTrainOptions) => {
  if (!input.origin || !input.destination) {
    return 'no data for these stations';
  }

  const originCoords = input.origin.location.coordinates;
  const destinationCoords = input.destination.location.coordinates;

  const payload = {
    currency: input.currency,
    from: {
      lat: originCoords[1],
      lon: originCoords[0]
    },
    to: {
      lat: destinationCoords[1],
      lon: destinationCoords[0]
    },
    locale: input.language,
    outboundDateTime: moment.utc(
      input.legs[0].departure + 'T' + '19:14:27.919Z'
    ),
    travellers: [
      {
        age: 25
      }
    ],
    inboundDateTime:
      input.tripType === 'round'
        ? moment.utc(input.legs[1].departure + 'T' + '15:07:25Z')
        : undefined
  };

  let completed = false;

  let data = await axios
    .post('https://api-test.omio.com/v2/search', payload, {
      headers: {
        Authorization: 'f8ed8a56-a02a-453c-811a-ede4d69b6f8f',
        'X-Forwarded-For': '127.0.0.1'
      }
    })
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err);
      completed = true;
      return {};
    });

  const { searchId } = data;

  do {
    data = await axios
      .get(`https://api-test.omio.com/v2/search/${searchId}`, {
        headers: {
          Authorization: 'f8ed8a56-a02a-453c-811a-ede4d69b6f8f',
          'X-Forwarded-For': '127.0.0.1'
        }
      })
      .then((res) => res.data)
      .catch((err) => {
        logger.error(err);
        completed = true;
        return {};
      });

    if (data.status === 'done') {
      completed = true;
    }
  } while (!completed);

  return data;
};

export default search;
