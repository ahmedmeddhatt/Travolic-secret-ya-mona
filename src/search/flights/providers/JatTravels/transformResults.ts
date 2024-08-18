import moment from 'moment';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';
const providerName = 'JatTravels';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const filterSegemtData = (flight: any) => {
  const departureDate = `${flight['departureDate']}T${flight['departureTime']}`;
  const arrivalDate = `${flight['arrivalDate']}T${flight['arrivalTime']}`;
  const transFormedSegment: TransformedSegmentWithoutID = {
    origin: flight['origin'],
    destination: flight['destination'],
    departure: moment
      .utc(departureDate, 'YYYY-MM-DDTHH:mm')
      .format('YYYYMMDDHHmm'),
    arrival: moment.utc(arrivalDate, 'YYYY-MM-DDTHH:mm').format('YYYYMMDDHHmm'),
    marketingCarrier: flight['operatingAirline'],
    operatingCarrier: flight['operatingAirline'],
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
    segments: {},
    legs: {},
    itineraries: {},
    codeShare: {}
  };
  transformedResult.agents[agent.id] = agent;

  if (
    !data ||
    !data['flights'] ||
    data['flights'] == null ||
    Object.keys(data).length === 0
  )
    return transformedResult;

  const offers = data['flights'];
  for (const offer of offers) {
    const { price, url, currency } = offer;
    const outboundLeg = offer['segment'][0]['leg'];

    let Segments: TransformedSegment[] = [];
    const Legs: TransformedLeg[] = [];
    for (const seg of outboundLeg) {
      const transFormedSegment: TransformedSegmentWithoutID =
        filterSegemtData(seg);
      const Segemnt = buildSegment(transFormedSegment);
      Segments.push(Segemnt);
      transformedResult.segments[Segemnt.id] = Segemnt;
      transformedResult.codeShare[
        `${offer.marketingAirline}${seg.flightNumber}`
      ] = {
        marketingCarrier: offer.marketingAirline,
        operatingCarrier: seg.operatingAirline
      };
    }
    let Leg = buildLegFromSegments(Segments);
    Legs.push(Leg);
    transformedResult.legs[Leg.id] = Leg;
    Segments = [];

    if (input.tripType === 'round') {
      const inboundLeg = offer['segment'][1]['leg'];
      for (const seg of inboundLeg) {
        const transFormedSegment: TransformedSegmentWithoutID =
          filterSegemtData(seg);
        const Segemnt = buildSegment(transFormedSegment);
        Segments.push(Segemnt);
        transformedResult.segments[Segemnt.id] = Segemnt;
        transformedResult.codeShare[
          `${offer.marketingAirline}${seg.flightNumber}`
        ] = {
          marketingCarrier: offer.marketingAirline,
          operatingCarrier: seg.operatingAirline
        };
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
          amount: price,
          currency
        }
      }
    ];
    transformedResult.itineraries[itinerary.id] = itinerary;
  }
  return transformedResult;
};

export default transformResults;
