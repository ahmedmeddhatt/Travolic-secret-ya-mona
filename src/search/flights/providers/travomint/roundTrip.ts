import moment from 'moment';

import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

const roundTrip = (
  providerName: string,
  agent: IDictionary<string>,
  transformedResult: TransformedResult,
  flightResult: any
): TransformedResult => {
  for (const flight of flightResult) {
    const { outBound, inBound, deepLink, fare, currencyCode } = flight;
    const Legs: TransformedLeg[] = [];
    const Segments: TransformedSegment[] = [];

    for (const item of outBound) {
      const {
        fromAirport,
        toAirport,
        depDate,
        reachDate,
        airline,
        flightNo,
        opratingAirline
      } = item;
      const segment = buildSegment({
        origin: fromAirport,
        destination: toAirport,
        departure: moment.utc(depDate).format('YYYYMMDDHHmm'),
        arrival: moment.utc(reachDate).format('YYYYMMDDHHmm'),
        marketingCarrier: airline,
        marketingFlightNumber: flightNo,
        operatingCarrier: opratingAirline,
        vehicleType: 'FLIGHT'
      });

      Segments.push(segment);
      transformedResult.segments[segment.id] = segment;
    }

    for (const item of inBound) {
      const {
        fromAirport,
        toAirport,
        depDate,
        reachDate,
        airline,
        flightNo,
        opratingAirline
      } = item;
      const segment = buildSegment({
        origin: fromAirport,
        destination: toAirport,
        departure: moment.utc(depDate).format('YYYYMMDDHHmm'),
        arrival: moment.utc(reachDate).format('YYYYMMDDHHmm'),
        marketingCarrier: airline,
        marketingFlightNumber: flightNo,
        operatingCarrier: opratingAirline,
        vehicleType: 'FLIGHT'
      });

      Segments.push(segment);
      transformedResult.segments[segment.id] = segment;
    }

    const Leg = buildLegFromSegments(Segments);
    Legs.push(Leg);
    transformedResult.legs[Leg.id] = Leg;

    const itinerary = buildItineraryFromLegs(Legs);
    const deepLinkPayload = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url: deepLink
    });

    itinerary.pricingOptions = [
      {
        agent: agent.id,
        agentName: agent.name,
        deepLink: deepLinkPayload,
        price: {
          amount: fare.grandTotal,
          currency: currencyCode
        }
      }
    ];
    transformedResult.itineraries[itinerary.id] = itinerary;
  }

  return transformedResult;
};

export default roundTrip;
