import moment from 'moment';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';
const providerName = 'Travelo1';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const filterSegemtData = (flight: any) => {
  const departureDate = flight['DepartureDateStrUTC'];
  const arrivalDate = flight['ArrivalDateStrUTC'];
  const transFormedSegment: TransformedSegmentWithoutID = {
    origin: flight['Departure'],
    destination: flight['Arrival'],
    departure: moment
      .utc(departureDate, 'YYYY-MM-DDTHH:mm')
      .format('YYYYMMDDHHmm'),
    arrival: moment.utc(arrivalDate, 'YYYY-MM-DDTHH:mm').format('YYYYMMDDHHmm'),
    marketingCarrier: flight['AirlineCode'],
    operatingCarrier: flight['AirlineCode'],
    marketingFlightNumber: flight['FlightNumber'],
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
    itineraries: {}
  };
  transformedResult.agents[agent.id] = agent;

  if (Object.keys(Data).length === 0 || !Data) {
    transformedResult['error'] = 'No result found';
    return transformedResult;
  }

  const offers = Data;
  for (const offer of offers) {
    const totalPrice = offer['TotalAmount'],
      routesOffers = offer['routes'];
    let onewayArr = [];
    const roundArr = [];

    if (input.tripType === 'round') {
      for (const routeOffer of routesOffers) {
        if (routeOffer['return'] === 0) {
          onewayArr.push(routeOffer);
        } else {
          roundArr.push(routeOffer);
        }
      }
    } else {
      onewayArr = routesOffers;
    }

    const outboundLeg = onewayArr;
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
      const inboundLeg = roundArr;
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
    const url = offer['deeplink'];
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
          currency: input.currency
        }
      }
    ];
    transformedResult.itineraries[itinerary.id] = itinerary;
  }

  return transformedResult;
};
export default transformResults;
