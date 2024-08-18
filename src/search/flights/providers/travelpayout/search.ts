import axios from 'axios';
import { createHash } from 'crypto';
import { createObjectSignature } from '../../../../utils';
import logger from '../../../../configs/logger';

const {
  TRAVEL_PAYOUT_MARKER,
  TRAVEL_PAYOUT_HOST,
  TRAVEL_PAYOUT_API_KEY,
  TRAVEL_PAYOUT_API_SEARCH,
  TRAVEL_PAYOUT_API_SEARCH_RESULT
} = process.env;

const tripTypesMap: IDictionary<string> = {
  round: 'RoundTrip',
  oneway: 'OneWay'
};

const classMap: IDictionary<string> = {
  Economy: 'Y',
  Premium_Economy: 'P',
  Business: 'C',
  First: 'F'
};

const hashSignature = (signature: string): string => {
  // file deepcode ignore InsecureHash: < https://support.travelpayouts.com/hc/en-us/articles/210996008-How-to-create-a-signature-md-5- >
  return createHash('md5').update(signature).digest('hex');
};

const transformOptions = (options: SearchOptions) => {
  const { legs, tripType, currency, adults, children, infants, cabinClass } =
    options;

  return {
    from: legs[0].origin,
    to: legs[0].destination,
    tripType: tripTypesMap[tripType],
    segments: legs.map((leg) => ({
      origin: leg.origin,
      destination: leg.destination,
      date: leg.departure
    })),
    currency,
    adults,
    children,
    infants,
    cabinClass: classMap[cabinClass]
  };
};

const search = async (input: SearchOptions) => {
  const { userData } = input;
  const options = transformOptions(input);
  const tripData = {
    currency: options.currency,
    host: TRAVEL_PAYOUT_HOST,
    locale: 'en',
    marker: TRAVEL_PAYOUT_MARKER,
    segments: options.segments,
    passengers: {
      adults: options.adults,
      children: options.children,
      infants: options.infants
    },
    trip_class: options.cabinClass,
    user_ip: userData.ip
  };

  const signature = hashSignature(
    createObjectSignature(tripData, TRAVEL_PAYOUT_API_KEY)
  );

  const payload = {
    signature,
    ...tripData
  };

  const searchID = await axios
    .post(TRAVEL_PAYOUT_API_SEARCH, JSON.stringify(payload), {
      headers: {
        'Content-type': 'application/json'
      }
    })
    .then((res) => res.data.search_id)
    .catch((err) => {
      logger.error(err);
      return '';
    });

  if (searchID === '') return [];

  const requestURL = `${TRAVEL_PAYOUT_API_SEARCH_RESULT}?uuid=${searchID}`;
  const results = [];
  let request = await axios
    .get(requestURL, {
      headers: {
        'Accept-Encoding': 'gzip,deflate,sdch'
      }
    })
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err);
      return [];
    });

  results.push(...request);

  while (request.length !== 0) {
    request = await axios
      .get(requestURL, {
        headers: {
          'Accept-Encoding': 'gzip,deflate,sdch'
        }
      })
      .then((res) => res.data)
      .catch((err) => {
        logger.error(err);
        return [];
      });

    results.push(...request);
  }

  return results;
};

export default search;
