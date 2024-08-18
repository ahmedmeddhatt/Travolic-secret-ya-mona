import moment from 'moment';
import {
  makeItineraryId,
  makeLegId,
  makeSegmentId,
  encodeRedirectPayload,
  createConvertDateTime
} from '../../../../utils';

const convertDateTiem = createConvertDateTime();

const providerName = 'Ryanair';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName,
  isCarrier: true,
  isAirline: true,
  iataCode: 'FR'
};

const buildSegments = (flights, currency) => {
  const segments = {};

  flights.forEach((flight) => {
    if (flight.faresLeft === 0) {
      return;
    }
    const segment = flight.segments[0];
    const { origin, destination } = segment;

    const tSegment = {
      origin,
      destination,
      departure: convertDateTiem(segment.time[0]),
      arrival: convertDateTiem(segment.time[1]),
      marketingCarrier: flight.flightNumber.split(' ')[0],

      pricingOptions: [
        {
          agent: agent.id,
          agentName: agent.name,
          originalPrice: flight.regularFare,
          price: {
            amount: flight.regularFare.fares[0].amount,
            currency
          }
        }
      ]
    };
    const id = makeSegmentId({
      origin,
      destination,
      departure: convertDateTiem(segment.time[0]),
      arrival: convertDateTiem(segment.time[1]),
      marketingCarrier: flight.flightNumber.split(' ')[0],
      marketingFlightNumber: '',
      operatingCarrier: '',
      vehicleType: 'FLIGHT'
    });

    segments[id] = {
      id,
      ...tSegment
    };
  });

  return segments;
};

const buildLegs = (segments) => {
  const legs = {};

  Object.keys(segments).forEach((key) => {
    const segment = segments[key];
    const {
      id: segmentId,
      origin,
      destination,
      departure,
      arrival,
      marketingCarrier,
      pricingOptions
    } = segment;

    const tLeg = {
      origin,
      departure,
      destination,
      arrival,
      pricingOptions,
      segments: [segmentId],
      stopCount: 0,
      marketingCarriers: [marketingCarrier]
    };
    const id = makeLegId(tLeg);

    legs[id] = {
      id,
      ...tLeg
    };
  });

  return legs;
};

const makeLink = (origin, destination, departDate, returnDate) => {
  const link = `https://www.ryanair.com/gb/en/booking/home/${origin}/${destination}/${departDate}/${returnDate}/1/0/0/0`;
  return link;
};

const buildItineraries = (legsOut, legsIn) => {
  const itineraries = {};

  const preItineraries: any[] = Object.values(legsOut).reduce<any[]>(
    (acc: any[], legOut) => {
      if (Object.values(legsIn).length > 0) {
        return [
          ...acc,
          ...Object.values(legsIn).map((legIn) => [legOut, legIn])
        ];
      }
      return [...acc, [legOut]];
    },
    []
  );

  preItineraries.forEach((itineraryLegs) => {
    const { origin, destination, departDate, returnDate } = {
      origin: itineraryLegs[0].origin,
      destination: itineraryLegs[0].destination,
      departDate: moment
        .utc(itineraryLegs[0].departure, 'YYYYMMDDHHmm')
        .format('YYYY-MM-DD'),
      returnDate: itineraryLegs[1]
        ? moment
            .utc(itineraryLegs[1].departure, 'YYYYMMDDHHmm')
            .format('YYYY-MM-DD')
        : ''
    };

    const deepLinkToken = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url: makeLink(origin, destination, departDate, returnDate)
    });

    const itinerary = {
      legs: itineraryLegs.map((leg) => leg.id),
      pricingOptions: [
        itineraryLegs.reduce(
          (acc, curr) => {
            const currPrice = curr.pricingOptions[0].price;
            const amount = acc.price.amount + currPrice.amount;
            return {
              ...curr.pricingOptions[0],
              ...acc,
              price: {
                currency: currPrice.currency,
                amount: Math.round(amount * 100) / 100
              }
            };
          },
          {
            deepLink: deepLinkToken,
            price: { amount: 0 }
          }
        )
      ],
      isFavorite: false
    };

    const id = makeItineraryId(itinerary);
    itineraries[id] = {
      id,
      ...itinerary
    };
  });

  return itineraries;
};

const removePricingOptions = (objectOfObjects) => {
  const newObjects = {};
  Object.keys(objectOfObjects).forEach((key) => {
    const object = objectOfObjects[key];
    delete object.pricingOptions;
    newObjects[object.id] = object;
  });
  return newObjects;
};

type RayanairResponse = any;
function transformResults(
  _: SearchOptions,
  data: RayanairResponse
): TransformedResult {
  const transformedResult: TransformedResult = {
    agents: {},
    legs: {},
    itineraries: {},
    segments: {}
  };

  if (!data.trips || data.trips.length === 0) {
    return transformedResult;
  }

  const { currency } = data;

  transformedResult.agents[agent.id] = agent;

  const outFlights = data.trips[0].dates[0].flights;
  const inFlights = data.trips[1] ? data.trips[1].dates[0].flights : [];

  const [segmentsOut, segmentsIn] = [
    buildSegments(outFlights, currency),
    buildSegments(inFlights, currency)
  ];

  const [legsOut, legsIn] = [buildLegs(segmentsOut), buildLegs(segmentsIn)];

  const itineraries = buildItineraries(legsOut, legsIn);

  transformedResult.segments = removePricingOptions({
    ...segmentsOut,
    ...segmentsIn
  });

  transformedResult.legs = removePricingOptions({
    ...legsOut,
    ...legsIn
  });

  transformedResult.itineraries = itineraries;

  return transformedResult;
}

export default transformResults;
