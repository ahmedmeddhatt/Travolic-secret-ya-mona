import moment from 'moment';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';
const providerName = 'EazyFares';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const filterSegemtData = (flight: any) => {
  const departureDate = `${flight['depDate']}T${flight['depTime']}`;
  const arrivalDate = `${flight['arrDate']}T${flight['arrTime']}`;
  const transFormedSegment: TransformedSegmentWithoutID = {
    origin: flight['depAirport'],
    destination: flight['arrAirport'],
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
  Data: any
): TransformedResult => {
  const transformedResult: TransformedResult = {
    agents: {},
    segments: {},
    legs: {},
    itineraries: {},
    codeShare: {}
  };

  if (
    !Data ||
    Object.keys(Data).length === 0 ||
    !Data['flights'] ||
    Data['flights'].length === 0
  )
    return transformedResult;

  transformedResult.agents[agent.id] = agent;

  const offers = Data['flights'];
  for (const offer of offers) {
    const { totalPrice, currency } = offer;

    const outboundLeg = offer['segment'][0]['seg'];

    let Segments: TransformedSegment[] = [];
    const Legs: TransformedLeg[] = [];
    for (const seg of outboundLeg) {
      const transFormedSegment: TransformedSegmentWithoutID =
        filterSegemtData(seg);
      const Segemnt = buildSegment(transFormedSegment);
      Segments.push(Segemnt);
      transformedResult.segments[Segemnt.id] = Segemnt;
      transformedResult.codeShare[`${seg.airline}${seg.flightNumber}`] = {
        marketingCarrier: offer.valCarrier ?? seg.airline,
        operatingCarrier: seg.operatingAirline,
        aircraftType: seg.equipment
      };
    }
    let Leg = buildLegFromSegments(Segments);
    Legs.push(Leg);
    transformedResult.legs[Leg.id] = Leg;
    Segments = [];

    if (input.tripType === 'round') {
      const inboundLeg = offer['segment'][1]['seg'];
      for (const seg of inboundLeg) {
        const transFormedSegment: TransformedSegmentWithoutID =
          filterSegemtData(seg);
        const Segemnt = buildSegment(transFormedSegment);
        Segments.push(Segemnt);
        transformedResult.segments[Segemnt.id] = Segemnt;
        transformedResult.codeShare[`${seg.airline}${seg.flightNumber}`] = {
          marketingCarrier: offer.valCarrier ?? seg.airline,
          operatingCarrier: seg.operatingAirline,
          aircraftType: seg.equipment
        };
      }
      Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
    }
    const url = offer['redirectUrl'];
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
          currency
        }
      }
    ];
    transformedResult.itineraries[itinerary.id] = itinerary;
  }
  return transformedResult;
};

export default transformResults;
