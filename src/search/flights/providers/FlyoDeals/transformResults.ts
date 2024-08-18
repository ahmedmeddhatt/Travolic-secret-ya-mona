import moment from 'moment';
import {
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs,
  encodeRedirectPayload
} from '../../../../utils';

const providerName = 'FlyoDeals';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const createID = (flight: any) => {
  const transFormedSegment: TransformedSegmentWithoutID = {
    origin: flight['departureAirportCode'],
    destination: flight['arrivalAirportCode'],
    departure: moment
      .utc(flight['departureDateTime'], 'YYYY-MM-DDTHH:mm:ss')
      .format('YYYYMMDDHHmm'),
    arrival: moment
      .utc(flight['arrivalDateTime'], 'YYYY-MM-DDTHH:mm:ss')
      .format('YYYYMMDDHHmm'),
    marketingCarrier: flight['operatingAirlineCode'],
    operatingCarrier: flight['operatingAirlineCode'],
    marketingFlightNumber: flight['flightNumber'],
    vehicleType: 'FLIGHT'
  };
  return transFormedSegment;
};
const transformResults = (
  input: SearchOptions,
  data: any
): TransformedResult => {
  const transformedResult: TransformedResult = {
    agents: {},
    legs: {},
    itineraries: {},
    segments: {}
  };
  transformedResult.agents[agent.id] = agent;
  if (!data || Object.keys(data).length === 0) return transformedResult;
  const offers = data['flightItineraries'];
  for (const offer of offers) {
    let Segments: TransformedSegment[] = [];
    const Legs: TransformedLeg[] = [];
    const totalPrice = offer['price']['totalAmount'];
    for (const seg of offer['leg1']['segments']) {
      const transFormedSegment: TransformedSegmentWithoutID = createID(seg);
      const segment = buildSegment(transFormedSegment);
      Segments.push(segment);
      transformedResult.segments[segment.id] = segment;
    }
    let leg = buildLegFromSegments(Segments);
    Legs.push(leg);
    transformedResult.legs[leg.id] = leg;
    Segments = [];
    if (input.tripType === 'round') {
      for (const seg of offer['leg2']['segments']) {
        const transFormedSegment: TransformedSegmentWithoutID = createID(seg);
        const segment = buildSegment(transFormedSegment);
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
      }
      leg = buildLegFromSegments(Segments);
      Legs.push(leg);
      transformedResult.legs[leg.id] = leg;
    }
    const deepLink = offer['deeplinkUrl'];
    const itinerary = buildItineraryFromLegs(Legs);
    const encodedDeepLink = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url: deepLink
    });
    itinerary.pricingOptions = [
      {
        agent: agent.id,
        agentName: agent.name,
        deepLink: encodedDeepLink,
        price: {
          amount: totalPrice,
          currency: 'USD'
        }
      }
    ];
    transformedResult.itineraries[itinerary.id] = itinerary;
  }
  return transformedResult;
};

export default transformResults;
