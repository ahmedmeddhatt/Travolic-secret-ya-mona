import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';
const { WOWTICKETS_URL } = process.env;
import moment from 'moment';
const providerName = 'wowTickets';

const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const filterSegemtData = (flight: any) => {
  const departureDate = moment(
    flight['departure_date'] + ' ' + flight['departure_time'],
    'YYYY-MM-DD HH:mm'
  ).format('YYYYMMDDHHmm');
  const arrivalDate = moment(
    flight['arrival_date'] + ' ' + flight['arrival_time'],
    'YYYY-MM-DD HH:mm'
  ).format('YYYYMMDDHHmm');
  const transFormedSegment: TransformedSegmentWithoutID = {
    origin: flight['departure'],
    destination: flight['arrival'],
    departure: departureDate,
    arrival: arrivalDate,
    marketingCarrier: flight['marketing_carrier'],
    operatingCarrier: flight['operating_carrier'],
    marketingFlightNumber: flight['number'],
    vehicleType: flight['is_train'] ? 'TRAIN' : 'FLIGHT'
  };
  return transFormedSegment;
};

const transformResults = (
  options: SearchOptions,
  data: any
): TransformedResult => {
  const transformedResult: TransformedResult = {
    agents: {},
    legs: {},
    itineraries: {},
    segments: {}
  };
  transformedResult.agents[agent.id] = agent;
  if (
    options.tripType === 'multi' ||
    !data ||
    !data.variant ||
    data.variant.length === 0
  ) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }
  for (const route of data.variant) {
    const url = WOWTICKETS_URL + route.url;
    const { currency, price } = route;
    let Segments: TransformedSegment[] = [];
    const Legs: TransformedLeg[] = [];
    for (const unfilteredSegment of route.segment[0].flight) {
      const transFormedSegment: TransformedSegmentWithoutID =
        filterSegemtData(unfilteredSegment);
      const segment = buildSegment(transFormedSegment);
      Segments.push(segment);
      transformedResult.segments[segment.id] = segment;
    }

    const Leg = buildLegFromSegments(Segments);
    Legs.push(Leg);
    transformedResult.legs[Leg.id] = Leg;
    Segments = [];
    if (options.tripType === 'round') {
      for (const unfilteredSegment of route.segment[1].flight) {
        const transFormedSegment: TransformedSegmentWithoutID =
          filterSegemtData(unfilteredSegment);
        const segment = buildSegment(transFormedSegment);
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
      }
      const Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
    }
    const itinerary = buildItineraryFromLegs(Legs);
    const encodedDeepLink = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url
    });
    itinerary.pricingOptions = [
      {
        agent: agent.id,
        agentName: agent.name,
        deepLink: encodedDeepLink,
        price: {
          amount: price,
          currency: currency
        }
      }
    ];
    transformedResult.itineraries[itinerary.id] = itinerary;
  }
  return transformedResult;
};

export default transformResults;
