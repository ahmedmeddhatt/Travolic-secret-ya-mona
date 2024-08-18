import moment from 'moment';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';
const providerName = 'FlightFareBuddy';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const filterSegemtData = (flight: any) => {
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
  input: SearchOptions,
  data: any
): TransformedResult => {
  const transformedResult: TransformedResult = {
    agents: {},
    segments: {},
    legs: {},
    itineraries: {}
  };

  if (!data || !data['GetItineraries'] || Object.keys(data).length === 0)
    return transformedResult;

  transformedResult.agents[agent.id] = agent;

  const offers = data['GetItineraries'];
  for (const offer of offers) {
    const totalPrice = offer['TotalPrice'];
    const outboundLeg = offer['OutBound']['Sector'];

    let Segments: TransformedSegment[] = [];
    const Legs: TransformedLeg[] = [];
    for (const seg of outboundLeg) {
      const transFormedSegment: TransformedSegmentWithoutID =
        filterSegemtData(seg);
      const Segemnt = buildSegment(transFormedSegment);
      Segments.push(Segemnt);
      transformedResult.segments[Segemnt.id] = Segemnt;
    }
    let Leg = buildLegFromSegments(Segments);
    Legs.push(Leg);
    transformedResult.legs[Leg.id] = Leg;
    Segments = [];

    if (input.tripType === 'round') {
      const inboundLeg = offer['InBound']['Sector'];
      for (const seg of inboundLeg) {
        const transFormedSegment: TransformedSegmentWithoutID =
          filterSegemtData(seg);
        const Segemnt = buildSegment(transFormedSegment);
        Segments.push(Segemnt);
        transformedResult.segments[Segemnt.id] = Segemnt;
      }
      Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
    }
    const { Url } = offer;
    const itinerary = buildItineraryFromLegs(Legs);
    const encodedDeepLink = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url: Url
    });
    itinerary.pricingOptions = [
      {
        agent: agent.id,
        agentName: agent.name,
        deepLink: encodedDeepLink,
        price: {
          amount: totalPrice,
          currency: input.currency
        }
      }
    ];
    transformedResult.itineraries[itinerary.id] = itinerary;
  }
  return transformedResult;
};

export default transformResults;
