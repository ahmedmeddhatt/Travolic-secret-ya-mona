import moment from 'moment';
import {
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs,
  encodeRedirectPayload
} from '../../../../utils';

const providerName = 'LastFareDeals';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const filterSegemtData = (flight: any) => {
  const departureDate = `${flight.departureDate}T${flight.departureTime}`;
  const arrivalDate = `${flight.arrivalDate}T${flight.arrivalTime}`;
  const transFormedSegment: TransformedSegmentWithoutID = {
    origin: flight.departure,
    destination: flight.arrival,
    departure: moment
      .utc(departureDate, 'YYYYMMDDTHHmm A')
      .format('YYYYMMDDHHmm'),
    arrival: moment.utc(arrivalDate, 'YYYYMMDDTHHmm A').format('YYYYMMDDHHmm'),
    marketingCarrier: flight.flightNumber.designator,
    operatingCarrier: flight.flightNumber.designator,
    marketingFlightNumber: flight.flightNumber.number,
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
    data.responseStatus === false ||
    data.flightItinerary === null
  )
    return transformedResult;

  transformedResult.agents[agent.id] = agent;

  const offers = data.flightItinerary;
  for (const offer of offers) {
    const totalPrice = offer.price.totalAmount,
      currency = offer.price.currencyCode,
      outboundLeg = offer.outboundLeg.segments.flightSegment,
      Legs: TransformedLeg[] = [];
    let Segments: TransformedSegment[] = [];
    for (const seg of outboundLeg) {
      const transFormedSegment: TransformedSegmentWithoutID =
        filterSegemtData(seg);
      const Segment = buildSegment(transFormedSegment);
      Segments.push(Segment);
      transformedResult.segments[Segment.id] = Segment;
      transformedResult.codeShare[
        `${seg.flightNumber.designator}${seg.flightNumber.number}`
      ] = {
        marketingCarrier: seg.flightNumber.designator,
        operatingCarrier: seg.flightNumber.designator
      };
    }
    const Leg = buildLegFromSegments(Segments);
    Legs.push(Leg);
    transformedResult.legs[Leg.id] = Leg;
    Segments = [];

    if (options.tripType === 'round') {
      const inboundLeg = offer.inboundLeg.segments.flightSegment;
      for (const seg of inboundLeg) {
        const transFormedSegment: TransformedSegmentWithoutID =
          filterSegemtData(seg);
        const Segment = buildSegment(transFormedSegment);
        Segments.push(Segment);
        transformedResult.segments[Segment.id] = Segment;
        transformedResult.codeShare[
          `${seg.flightNumber.designator}${seg.flightNumber.number}`
        ] = {
          marketingCarrier: seg.flightNumber.designator,
          operatingCarrier: seg.flightNumber.designator
        };
      }
      const Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
    }
    const url = offer.deeplinkURL;
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
