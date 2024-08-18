import axios from 'axios';
import moment from 'moment';
import querystring from 'query-string';

const { KIWI_API_KEY, KIWI_MULTI_API_KEY } = process.env;

const cabinClassMap: IDictionary<string> = {
  Economy: 'M',
  Premium_Economy: 'W',
  First: 'F',
  Business: 'C'
};

const transformOpions = (options) => {
  const {
    currency,
    adults,
    children,
    infants,
    cabinClass,
    tripType,
    legs,
    language
  } = options;

  return {
    legs,
    cabinClass: cabinClassMap[cabinClass],
    currency,
    tripType,
    adults,
    children,
    infants,
    language
  };
};

const ConvertLegs = (inputs) => {
  const results = [];
  let result = {};
  for (const leg of inputs.legs) {
    result['flyFrom'] = leg.origin;
    result['to'] = leg.destination;
    result['dateFrom'] = moment.utc(leg.departure).format('DD/MM/YYYY');
    result['dateTo'] = moment.utc(leg.departure).format('DD/MM/YYYY');
    result['selected_cabins'] = inputs.cabinClass;
    result['adults'] = inputs.adults;
    result['children'] = inputs.children;
    result['infants'] = inputs.infants;
    result['curr'] = inputs.currency;
    result['locale'] = inputs.language;

    results.push(result);
    result = {};
  }

  return results;
};

const search = async (input: SearchOptions) => {
  const options = transformOpions(input);
  if (options.language == 'zh') {
    options.language = 'cn';
  }

  if (input.tripType === 'multi') {
    const payload = {
      requests: ConvertLegs(options)
    };

    const { data } = await axios.post(
      'https://tequila-api.kiwi.com/v2/flights_multi',
      payload,
      {
        headers: {
          apikey: KIWI_MULTI_API_KEY
        }
      }
    );

    return data;
  } else {
    const payload = {
      fly_from: options.legs[0].origin,
      fly_to: options.legs[0].destination,
      date_from: moment.utc(options.legs[0].departure).format('DD/MM/YYYY'),
      date_to: moment.utc(options.legs[0].departure).format('DD/MM/YYYY'),
      flight_type: options.tripType,
      adults: options.adults,
      children: options.children,
      infants: options.infants,
      selected_cabins: options.cabinClass,
      vehicle_type: 'aircraft',
      curr: options.currency,
      locale: options.language,
      return_from: undefined,
      return_to: undefined
    };

    if (options.tripType == 'round') {
      payload.return_from = moment
        .utc(options.legs[1].departure)
        .format('DD/MM/YYYY');
      payload.return_to = moment
        .utc(options.legs[1].departure)
        .format('DD/MM/YYYY');
    }

    const { data } = await axios.get(
      'https://tequila-api.kiwi.com/v2/search?' +
        querystring.stringify(payload),
      {
        headers: {
          'content-type': 'application/json',
          apikey: KIWI_API_KEY
        }
      }
    );

    return data;
  }
};
export default search;
