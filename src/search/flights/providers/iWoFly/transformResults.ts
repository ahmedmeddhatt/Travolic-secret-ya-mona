import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

const providerName = 'Iwofly';

const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const filterSegemtData = (flight: any) => {
  const departureDate = flight['depTime'];
  const arrivalDate = flight['arrTime'];
  const transFormedSegment: TransformedSegmentWithoutID = {
    origin: flight['depAirport'],
    destination: flight['arrAirport'],
    departure: departureDate,
    arrival: arrivalDate,
    marketingCarrier: flight['carrier'],
    operatingCarrier: flight['operatingCarrier'],
    marketingFlightNumber: flight['flightNumber'],
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
  transformedResult.agents[agent.id] = agent;
  if (
    options.tripType === 'multi' ||
    !data ||
    !data.routings ||
    data.routings.length === 0
  ) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }
  for (const route of data.routings) {
    const totalPrice =
      (route.adultPrice + route.adultTax) * options.adults +
      (route.childPrice + route.childTax) * options.children +
      (route.infantPrice + route.infantTax) * options.infants;
    const { referralLink } = route;
    const { currency } = route;
    let Segments: TransformedSegment[] = [];
    const Legs: TransformedLeg[] = [];
    for (const seg of route.fromSegments) {
      const transFormedSegment: TransformedSegmentWithoutID =
        filterSegemtData(seg);
      const segment = buildSegment(transFormedSegment);
      Segments.push(segment);
      transformedResult.segments[segment.id] = segment;
      transformedResult.codeShare[`${seg.carrier}${seg.flightNumber}`] = {
        marketingCarrier: seg.carrier,
        operatingCarrier: seg.operatingCarrier,
        aircraftType: seg.aircraftCode
      };
    }
    const Leg = buildLegFromSegments(Segments);
    Legs.push(Leg);
    transformedResult.legs[Leg.id] = Leg;
    Segments = [];
    if (options.tripType === 'round') {
      for (const seg of route.retSegments) {
        const transFormedSegment: TransformedSegmentWithoutID =
          filterSegemtData(seg);
        const segment = buildSegment(transFormedSegment);
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
        transformedResult.codeShare[`${seg.carrier}${seg.flightNumber}`] = {
          marketingCarrier: seg.carrier,
          operatingCarrier: seg.operatingCarrier,
          aircraftType: seg.aircraftCode
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
      url: referralLink
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
