import {
  createConvertDateTime,
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

const providerName = 'Flightsmojo';

const convertDateTiem = createConvertDateTime('YYYY-MM-DDTHH:mm');

const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const transformResults = (_: SearchOptions, data: any): TransformedResult => {
  const trnsformedResult: TransformedResult = {
    agents: {},
    legs: {},
    itineraries: {},
    segments: {}
  };

  if (Object.keys(data).length === 0) {
    trnsformedResult['error'] = 'No data found.';
    return trnsformedResult;
  }

  if (data.flights.length < 1) {
    trnsformedResult['error'] = 'No data found.';
    return trnsformedResult;
  }

  trnsformedResult.agents[agent.id] = agent;

  for (const flight of data.flights) {
    const itineraryLegs = flight.segment.map((leg) => leg.leg);
    const Legs: TransformedLeg[] = [];

    for (const leg of itineraryLegs) {
      if (!leg || leg.length < 1) {
        return;
      }

      const Segments: TransformedSegment[] = [];

      for (const outLeg of leg) {
        const segment = buildSegment({
          origin: outLeg.origin,
          destination: outLeg.destination,
          departure: convertDateTiem(
            `${outLeg.departureDate}T${outLeg.departureTime}`
          ),
          arrival: convertDateTiem(
            `${outLeg.arrivalDate}T${outLeg.arrivalTime}`
          ),
          marketingCarrier: outLeg.airline,
          operatingCarrier: outLeg.operatingAirline,
          marketingFlightNumber: outLeg.flightNumber,
          vehicleType: 'FLIGHT'
        });

        Segments.push(segment);
        trnsformedResult.segments[segment.id] = segment;
      }

      const Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      trnsformedResult.legs[Leg.id] = Leg;
    }

    const itinerary = buildItineraryFromLegs(Legs);
    const deepLinkPayload = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url: flight.url
    });

    itinerary.pricingOptions = [
      {
        agent: agent.id,
        agentName: agent.name,
        deepLink: deepLinkPayload,
        price: {
          amount: flight.price,
          currency: flight.currency
        }
      }
    ];

    trnsformedResult.itineraries[itinerary.id] = itinerary;
  }

  return trnsformedResult;
};

export default transformResults;
