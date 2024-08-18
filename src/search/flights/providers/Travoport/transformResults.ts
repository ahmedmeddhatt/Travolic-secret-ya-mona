import moment from 'moment';
import {
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs,
  encodeRedirectPayload
} from '../../../../utils';

const providerName = 'Travoport';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const filterSegemtData = (flight: any) => {
  const departureDate = `${flight.depDate}T${flight.depTime}`;
  const arrivalDate = `${flight.arrDate}T${flight.arrTime}`;
  const transFormedSegment: TransformedSegmentWithoutID = {
    origin: flight.depAirport,
    destination: flight.arrAirport,
    departure: moment
      .utc(departureDate, 'YYYY-MM-DDTHH:mm')
      .format('YYYYMMDDHHmm'),
    arrival: moment.utc(arrivalDate, 'YYYY-MM-DDTHH:mm').format('YYYYMMDDHHmm'),
    marketingCarrier: flight.airline,
    operatingCarrier: flight.operatingAirline,
    marketingFlightNumber: flight.flightNumber,
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
    Object.keys(data).length === 0 ||
    !data.flights ||
    data.flights.length === 0
  )
    return transformedResult;

  transformedResult.agents[agent.id] = agent;
  const offers = data['flights'];
  for (const offer of offers) {
    const { totalPrice } = offer;
    const outboundLeg = offer['segment'][0]['seg'];
    let Segments: TransformedSegment[] = [];
    const Legs: TransformedLeg[] = [];
    for (const seg of outboundLeg) {
      const transFormedSegment: TransformedSegmentWithoutID =
        filterSegemtData(seg);
      const Segment = buildSegment(transFormedSegment);
      Segments.push(Segment);
      transformedResult.segments[Segment.id] = Segment;
      transformedResult.codeShare[`${seg.airline}${seg.flightNumber}`] = {
        marketingCarrier: seg.airline,
        operatingCarrier: seg.operatingAirline,
        aircraftType: seg.equipment
      };
    }
    const Leg = buildLegFromSegments(Segments);
    Legs.push(Leg);
    transformedResult.legs[Leg.id] = Leg;
    Segments = [];
    if (options.tripType === 'round') {
      const inboundLeg = offer['segment'][1]['seg'];
      for (const seg of inboundLeg) {
        const transFormedSegment: TransformedSegmentWithoutID =
          filterSegemtData(seg);
        const Segment = buildSegment(transFormedSegment);
        Segments.push(Segment);
        transformedResult.segments[Segment.id] = Segment;
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
    const url = offer.redirectUrl;
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
          currency: 'USD'
        }
      }
    ];
    transformedResult.itineraries[itinerary.id] = itinerary;
  }
  return transformedResult;
};
export default transformResults;
