import queryString from 'querystring';
import moment from 'moment';
import { Country, Airport, City } from '../models';

export const splitName = (fullName: string): string[] => {
  const firstName = fullName.split(' ').slice(0, -1).join(' ');
  const lastName = fullName.split(' ').slice(-1).join(' ');

  return [firstName, lastName];
};

export const alphaSort = (a: any, b: any) => (a < b ? -1 : a > b ? 1 : 0);

export const last = (array: any[]) => array[array.length - 1];

export const randomString = (length = 5): string =>
  Math.random()
    .toString(36)
    .substring(2, 2 + length);

export const objectMap = (
  object: any,
  mapper: (currentValue: any, currentKey: string, index: number) => any
) => {
  return Object.keys(object).reduce((acc, current, index) => {
    return {
      ...acc,
      [current]: mapper(object[current], current, index)
    };
  }, {});
};

export const createObjectSignature = (object: any, seed = '') => {
  const signature: string = Object.keys(object)
    .sort(alphaSort)
    .reduce((memo, current) => {
      const value = object[current];
      if (typeof value === 'object') {
        return createObjectSignature(value, memo);
      }
      return `${memo}:${value}`;
    }, seed);
  return signature;
};

export const createFunctionArgsSignature = (args: any[]) => {
  return args
    .map((arg) => (typeof arg === 'object' ? createObjectSignature(arg) : arg))
    .join('|');
};

export const parseError = (error: Error) => {
  return {
    name: error.name,
    message: error.message,
    stack: parseErrorStack(error)
  };
};

export const parseErrorStack = (error: Error) => {
  const stack = error.stack.match(/^\s+at.*$/gm).map((line) => {
    let match = line
      .replace(/^\s*at\s*/, '')
      .match(/^(.*?)\s+\(([^)]+):(\d+):(\d+)\)$/);

    if (!match) {
      match = line.match(/^(.*?):(\d+):(\d+)$/);
      if (match) match.splice(1, 0, null);
    }
    if (match) {
      const [what, file, line, column] = match;
      return { what, file, line, column };
    } else {
      return { what: line };
    }
  });
  return stack;
};

export const encodeRedirectPayload = (payload: RedirectPayload): string => {
  return Buffer.from(queryString.stringify(payload)).toString('base64');
};

export const decodeRedirectPayload = (
  encodedPayload: string
): RedirectPayload => {
  return queryString.parse(
    Buffer.from(encodedPayload, 'base64').toString('utf8')
  ) as RedirectPayload;
};

export const decodeRedirectHotelPayload = (
  encodedPayload: string
): HotelRedirectPayload => {
  return queryString.parse(
    Buffer.from(encodedPayload, 'base64').toString('utf8')
  ) as HotelRedirectPayload;
};

export const decodeHotelRedirectPayload = (
  encodedPayload: string
): HotelRedirectPayload => {
  return queryString.parse(
    Buffer.from(encodedPayload, 'base64').toString('utf8')
  ) as HotelRedirectPayload;
};

export const makeItineraryId = (itinerary: TransformedItineraryWithoutID) => {
  return itinerary.legs.join('|');
};

export const parseItineraryId = (id: string) => {
  const legs = id.split('|');
  return legs.map((leg) => parseLegId(leg));
};

export const makeLegId = (leg: TransformedLegWithoutID) => {
  return `${leg.origin}-${leg.departure}-${leg.marketingCarriers.join(',')}-${
    leg.stopCount
  }-${leg.destination}-${leg.arrival}`;
};

export const parseLegId = (id: string) => {
  const [
    origin,
    departure,
    idMarketingCarriers,
    stopCount,
    destination,
    arrival
  ] = id.split('-');
  const marketingCarriers = idMarketingCarriers.split(',');
  return {
    origin,
    destination,
    departure,
    arrival,
    marketingCarriers,
    stopCount
  };
};

export const makeSegmentId = (segment: TransformedSegmentWithoutID) => {
  return `${segment.origin}-${segment.destination}-${segment.departure}-${segment.arrival}-${segment.marketingCarrier}`;
};

export const buildSegment = (
  inputSegment: TransformedSegmentWithoutID
): TransformedSegment => {
  return { id: makeSegmentId(inputSegment), ...inputSegment };
};

export const buildLegFromSegments = (
  inputSegments: TransformedSegment[]
): TransformedLeg => {
  const leg: TransformedLegWithoutID = {
    origin: inputSegments[0].origin,
    departure: inputSegments[0].departure,
    destination: inputSegments[inputSegments.length - 1].destination,
    arrival: inputSegments[inputSegments.length - 1].arrival,
    segments: inputSegments.map((segment) => segment.id),
    stopCount: inputSegments.length - 1,
    marketingCarriers: [
      ...new Set(inputSegments.map((segment) => segment.marketingCarrier))
    ],
    vehicleType: [
      ...new Set(inputSegments.map((segment) => segment.vehicleType))
    ]
  };

  return {
    id: makeLegId(leg),
    ...leg
  };
};

export const buildItineraryFromLegs = (
  legs: TransformedLeg[]
): TransformedItinerary => {
  const itinerary: TransformedItineraryWithoutID = {
    legs: legs.map((leg) => leg.id),
    pricingOptions: [],
    isFavorite: false
  };

  return {
    id: makeItineraryId(itinerary),
    ...itinerary
  };
};
export const buildItineraryFromTransferLegs = (
  legs: TransformedTransferLeg[]
): TransformedItinerary => {
  const itinerary: TransformedItineraryWithoutID = {
    legs: legs.map((leg) => leg.id),
    pricingOptions: [],
    isFavorite: false
  };
  return {
    id: makeItineraryId(itinerary),
    ...itinerary
  };
};

export const createConvertDateTime =
  (inputFormat?: string) => (inputDateTime: string) => {
    return moment.utc(inputDateTime, inputFormat).format('YYYYMMDDHHmm');
  };

export const createSelectCurrency =
  (supportedCurrencies, defaultCurrency) => (inputCurrency) =>
    supportedCurrencies.indexOf(inputCurrency) !== -1
      ? inputCurrency
      : defaultCurrency;

export const arrayToObjectByKey = (array, key) =>
  array.reduce((acc, current) => ({ ...acc, [current[key]]: current }), {});

export const checkSearchPos = (
  allow_countries: Array<string>,
  allow_routes: Array<string>,
  search: SearchOptions
) => {
  let check = true;
  if (allow_countries.length > 0) {
    if (allow_countries.indexOf(search.userData.country_code) === -1) {
      check = false;
    }
  }
  if (allow_routes.length > 0) {
    for (const leg of search.legs) {
      if (allow_routes.indexOf(leg.origin) !== -1) {
        check = true;
        break;
      } else {
        check = false;
      }
    }
  }
  return check;
};

export const stringSimilarity = (a: string, b: string): number => {
  a = a
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^\s+|\s+$/g, '');
  b = b
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^\s+|\s+$/g, '');

  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const bigramsA = new Map();
  let intersectionSize = 0;

  for (let i = 0; i < a.length - 1; i++) {
    const bigram = a.substring(i, i + 2);
    const count = bigramsA.has(bigram) ? bigramsA.get(bigram) + 1 : 1;

    bigramsA.set(bigram, count);
  }

  for (let i = 0; i < b.length - 1; i++) {
    const bigram = b.substring(i, i + 2);
    const count = bigramsA.has(bigram) ? bigramsA.get(bigram) : 0;

    if (count > 0) {
      bigramsA.set(bigram, count - 1);
      intersectionSize++;
    }
  }

  return (2.0 * intersectionSize) / (a.length + b.length - 2);
};

export const slash = (path: string): string => {
  const isExtendedLengthPath = path.startsWith('\\\\?\\');

  if (isExtendedLengthPath) {
    return path;
  }

  return path.replace(/\\/g, '/');
};

// get check the country of the city or airport is existed on the countries_array or not
export const checkCityAirportCountry = async (
  cityAirport_val: string,
  supportedCountry: string[] // array of the valid countries for this city or airport
): Promise<boolean> => {
  const cityData = await City.findOne({ code: cityAirport_val });

  if (cityData) {
    const countryCode = (await Country.findById(cityData.country)).code;
    if (supportedCountry.includes(countryCode)) {
      return true;
    }
    return false;
  } else {
    const airportData = await Airport.findOne({ code: cityAirport_val });
    if (airportData) {
      const cityData = await City.findById(airportData.city);
      if (cityData) {
        const countryCode = (await Country.findById(cityData.country)).code;
        if (supportedCountry.includes(countryCode)) {
          return true;
        }
        return false;
      }
      return false;
    }
    return false;
  }
};
