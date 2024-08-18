import moment from 'moment';
import {
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs,
  encodeRedirectPayload
} from '../../../../utils';

const providerName = 'CheapFlightFares';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const createID = (seg: any) => {
  const transFormedSegment: TransformedSegmentWithoutID = {
    origin: seg.departureAirport,
    destination: seg.arrivalAirport,
    departure: moment
      .utc(seg.departureDateTime, 'YYYY-MM-DDHH:mm')
      .format('YYYYMMDDHHmm'),
    arrival: moment
      .utc(seg.arrivalDateTime, 'YYYY-MM-DDHH:mm')
      .format('YYYYMMDDHHmm'),
    marketingCarrier: seg.marketingAirline,
    operatingCarrier: seg.operatingAirline,
    marketingFlightNumber: seg.flightNumber,
    vehicleType: seg.transportType
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

  if (Object.keys(data).length === 0 || !data.availableFlights) {
    transformedResult.error = 'No data found.';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;
  let Legs: TransformedLeg[] = [];
  let Segments: TransformedSegment[] = [];
  for (const flight of data.availableFlights) {
    const DeepLink = flight.deeplinkUrl;
    const { Currency, TotalAmount: price } = flight.price;
    //outBound
    const outSegmentsData = flight.outbound;
    for (const seg of outSegmentsData) {
      const transFormedSegment: TransformedSegmentWithoutID = createID(seg);
      const segment = buildSegment(transFormedSegment);
      Segments.push(segment);
      transformedResult.segments[segment.id] = segment;
      transformedResult.codeShare[
        `${seg.marketingAirline}${seg.flightNumber}`
      ] = {
        marketingCarrier: seg.marketingAirline,
        operatingCarrier: seg.operatingAirline,
        aircraftType: seg.equipmentType
      };
    }
    const Leg = buildLegFromSegments(Segments);
    Legs.push(Leg);
    transformedResult.legs[Leg.id] = Leg;
    Segments = [];
    //inBound
    if (flight.inbound.length > 0) {
      const insegmentsData = flight.inbound;
      for (const seg of insegmentsData) {
        const transFormedSegment: TransformedSegmentWithoutID = createID(seg);
        const segment = buildSegment(transFormedSegment);
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
        transformedResult.codeShare[
          `${seg.marketingAirline}${seg.flightNumber}`
        ] = {
          marketingCarrier: seg.marketingAirline,
          operatingCarrier: seg.operatingAirline,
          aircraftType: seg.equipmentType
        };
      }
      const Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
      Segments = [];
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
          currency: Currency
        }
      }
    ];
    transformedResult.itineraries[itinerary.id] = itinerary;
    Legs = [];
  }

  return transformedResult;
};
export default transformResults;
