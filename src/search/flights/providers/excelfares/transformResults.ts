import moment from 'moment';
import {
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs,
  encodeRedirectPayload
} from '../../../../utils';

const providerName = 'excelfares';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const createID = (flight: any) => {
  const departureDate = flight['DepDateTime'];
  const arrivalDate = flight['ArrDateTime'];

  const transFormedSegment: TransformedSegmentWithoutID = {
    origin: flight['DepAirportCode'],
    destination: flight['ArrAirportCode'],
    departure: moment
      .utc(departureDate, 'YYYY-MM-DDTHH:mm')
      .format('YYYYMMDDHHmm'),
    arrival: moment.utc(arrivalDate, 'YYYY-MM-DDTHH:mm').format('YYYYMMDDHHmm'),
    marketingCarrier: flight['MCarrier'],
    operatingCarrier: flight['OCarrier'],
    marketingFlightNumber: flight['FlightNo'],
    vehicleType: 'FLIGHT'
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
  if (!data || Object.keys(data).length === 0) return transformedResult;
  const offers = data['GetItineraries'];
  for (const offer of offers) {
    const currency = 'USD';
    const outBound = offer['OutBound']['Sector'];
    const url = offer['Url'];
    const totalPrice = offer['TotalPrice'];
    let Segments: TransformedSegment[] = [];
    const Legs: TransformedLeg[] = [];
    for (const seg of outBound) {
      const transFormedSegment: TransformedSegmentWithoutID = createID(seg);
      const Segment = buildSegment(transFormedSegment);
      Segments.push(Segment);
      transformedResult.segments[Segment.id] = Segment;
    }
    let Leg = buildLegFromSegments(Segments);
    Legs.push(Leg);
    transformedResult.legs[Leg.id] = Leg;
    Segments = [];

    if (options.tripType === 'round') {
      const inbound = offer['InBound']['Sector'];
      for (const seg of inbound) {
        const transFormedSegment: TransformedSegmentWithoutID = createID(seg);
        const Segment = buildSegment(transFormedSegment);
        Segments.push(Segment);
        transformedResult.segments[Segment.id] = Segment;
      }
      Leg = buildLegFromSegments(Segments);
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
          amount: totalPrice,
          currency: currency
        }
      }
    ];
    transformedResult.itineraries[itinerary.id] = itinerary;
  }
  return transformedResult;
};
export default transformResults;
