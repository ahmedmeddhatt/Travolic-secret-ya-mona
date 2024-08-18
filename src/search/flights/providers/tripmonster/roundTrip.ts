import moment from 'moment';
import querystring from 'querystring';

import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

const roundTrip = (
  trips: any,
  payload: any,
  agent: IDictionary<string>,
  providerName: string,
  transformedResult: TransformedResult
): TransformedResult => {
  for (const trip of trips) {
    const {
      price,
      currency,
      itinToken,
      segments,
      outboundStops,
      inboundStops
    } = trip;
    payload.itin_token = itinToken;

    const Legs: TransformedLeg[] = [];
    const Segments: TransformedSegment[] = [];

    for (const flight of segments.segment) {
      const {
        origin,
        destination,
        departureDateTime,
        arrivalDateTime,
        carrierCode,
        flightNumber
      } = flight;

      const transFormedSegment: TransformedSegmentWithoutID = {
        origin,
        destination,
        departure: moment
          .utc(departureDateTime, 'YYYY-MM-DD HH:mm')
          .format('YYYYMMDDHHmm'),
        arrival: moment
          .utc(arrivalDateTime, 'YYYY-MM-DD HH:mm')
          .format('YYYYMMDDHHmm'),
        marketingCarrier: carrierCode,
        operatingCarrier: carrierCode,
        marketingFlightNumber: flightNumber,
        vehicleType: 'FLIGHT'
      };

      const segment = buildSegment(transFormedSegment);

      Segments.push(segment);
      transformedResult.segments[segment.id] = segment;
    }

    if (outboundStops !== null) {
      let initialTrips = outboundStops.split('|');
      initialTrips = initialTrips.slice(0, initialTrips.length - 1);
      const outBound = Segments.slice(0, initialTrips.length + 1);
      const inBound = Segments.slice(initialTrips.length + 1, Segments.length);

      let Leg = buildLegFromSegments(outBound);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;

      Leg = buildLegFromSegments(inBound);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
    } else if (inboundStops !== null) {
      const outBound = Segments.slice(0, 1);
      let Leg = buildLegFromSegments(outBound);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;

      const inBound = Segments.slice(1, Segments.length);
      Leg = buildLegFromSegments(inBound);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
    } else {
      const outBound = Segments.slice(0, 1);
      const inBound = Segments.slice(1, 2);

      let Leg = buildLegFromSegments(outBound);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;

      Leg = buildLegFromSegments(inBound);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
    }

    const redirectPayload: RedirectPayload = {
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url:
        'http://deeplink.tripmonster.com/Flights.aspx?' +
        querystring.stringify(payload)
    };

    const deepLinkPayload = encodeRedirectPayload(redirectPayload);

    const itinerary = buildItineraryFromLegs(Legs);

    itinerary.pricingOptions = [
      {
        agent: agent.id,
        agentName: agent.name,
        deepLink: deepLinkPayload,
        price: {
          amount: parseFloat(price),
          currency: currency
        }
      }
    ];
    transformedResult.itineraries[itinerary.id] = itinerary;
  }

  return transformedResult;
};

export default roundTrip;
