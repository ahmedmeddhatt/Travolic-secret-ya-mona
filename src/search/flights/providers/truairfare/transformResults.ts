import moment from 'moment';
import {
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs,
  encodeRedirectPayload
} from '../../../../utils';

const providerName = 'Truairfare';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const createID = (seg: any) => {
  const departureDate = `${seg['depDate']}${seg['depTime']}`;
  const arrivalDate = `${seg['arrDate']}${seg['arrTime']}`;

  const transFormedSegment: TransformedSegmentWithoutID = {
    origin: seg.depAirport,
    destination: seg.arrAirport,
    departure: moment
      .utc(departureDate, 'YYYY-MM-DDHH:mm')
      .format('YYYYMMDDHHmm'),
    arrival: moment.utc(arrivalDate, 'YYYY-MM-DDHH:mm').format('YYYYMMDDHHmm'),
    marketingCarrier: seg.airline,
    operatingCarrier: seg.operatingAirline,
    marketingFlightNumber: seg.flightNumber,
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
    segments: {},
    codeShare: {}
  };

  if (
    !data ||
    !data.flights ||
    data.flights.length === 0 ||
    options.tripType === 'multi'
  ) {
    transformedResult['error'] = 'No data found';
    return transformedResult;
  }
  transformedResult.agents[agent.id] = agent;
  for (const flight of data.flights) {
    const DeepLink = flight.redirectUrl;
    const price = flight['totalPrice'];
    const { currency } = flight;
    const Legs: TransformedLeg[] = [];
    // flight.segment[0] => one way
    // flight.segment[1] => round trip
    for (const Journey of flight.segment) {
      const segmentsData = Journey.seg;
      const Segments: TransformedSegment[] = [];
      for (const seg of segmentsData) {
        const transFormedSegment: TransformedSegmentWithoutID = createID(seg);
        const segment = buildSegment(transFormedSegment);
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
        transformedResult.codeShare[`${seg.airline}${seg.flightNumber}`] = {
          marketingCarrier: seg.airline,
          operatingCarrier: seg.operatingAirline,
          aircraftType: seg.equipment
        };
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
      url: DeepLink
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
