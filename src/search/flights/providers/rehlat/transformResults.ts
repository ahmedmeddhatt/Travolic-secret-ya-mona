import {
  createConvertDateTime,
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

const providerName = 'Rehlat';
const convertDateTiem = createConvertDateTime();
const agent: IDictionary<string> = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
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

  if (
    Object.keys(data).length === 0 ||
    !data.flightItinerary ||
    data.flightItinerary.length === 0
  ) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  for (const item of data.flightItinerary) {
    const itineraryLegs = [];

    options.tripType === 'round'
      ? itineraryLegs.push(item.outboundLeg, item.inboundLeg)
      : itineraryLegs.push(item.outboundLeg);

    const Legs: TransformedLeg[] = [];

    for (const leg of itineraryLegs) {
      if (!leg || leg.segments.length < 1) return;

      const Segments: TransformedSegment[] = [];

      for (const outLeg of leg.segments) {
        const {
          DepartureAirportCode,
          ArrivalAirportCode,
          DepartureDateTime,
          ArrivalDateTime,
          flightNumber
        } = outLeg;
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: DepartureAirportCode,
          destination: ArrivalAirportCode,
          departure: convertDateTiem(DepartureDateTime),
          arrival: convertDateTiem(ArrivalDateTime),
          marketingCarrier: flightNumber.designator,
          operatingCarrier: flightNumber.designator,
          marketingFlightNumber: flightNumber.number,
          vehicleType: 'FLIGHT'
        };

        const segment = buildSegment(transFormedSegment);
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
      }

      const Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
    }

    const itinerary = buildItineraryFromLegs(Legs);
    const deepLinkPayload = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url: item.deeplinkURL
    });

    itinerary.pricingOptions = [
      {
        agent: agent.id,
        agentName: agent.name,
        deepLink: deepLinkPayload,
        price: {
          amount: item.price.amount,
          currency: item.price.currencyCode
        }
      }
    ];

    transformedResult.itineraries[itinerary.id] = itinerary;
  }

  return transformedResult;
};

export default transformResults;
