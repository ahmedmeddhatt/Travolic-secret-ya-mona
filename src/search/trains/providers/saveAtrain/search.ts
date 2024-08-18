import axios from 'axios';
import moment from 'moment';
import querystring from 'querystring';

const { SAVEATRAIN_EMAIL, SAVEATRAIN_PASSWORD } = process.env;

const tripTypesMap: IDictionary<string> = {
  oneway: '1',
  round: '2'
};

const transformOpions = (options: SearchTrainOptions) => {
  const { legs, tripType, adults, children, infants } = options;

  return {
    legs: legs,
    passengers: adults + infants + children,
    tripType: tripTypesMap[tripType]
  };
};

const search = async (input: SearchOptions) => {
  const options = transformOpions(input);

  const origin = input.origin.saveatrain_code;
  const destination = input.destination.saveatrain_code;

  if (!origin || !destination) {
    return {};
  }

  const payload = {
    triptype: options.tripType,
    passengers: options.passengers,
    ddate: moment.utc(options.legs[0].departure).format('YYYY-MM-DD'),
    email: SAVEATRAIN_EMAIL,
    password: SAVEATRAIN_PASSWORD,
    rdate:
      input.tripType === 'round'
        ? moment.utc(options.legs[1].departure).format('YYYY-MM-DD')
        : undefined
  };

  const url = `https://apisearch.saveatrain.com/search/${origin}/${destination}?${querystring.stringify(
    payload
  )}`;
  const { data } = await axios.get(url, {
    headers: {
      'content-type': 'application/json'
    }
  });

  return data;
};

export default search;
