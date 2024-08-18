import moment from 'moment';
import querystring from 'querystring';

import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

const oneWayTrip = (
  trips: any,
  payload: any,
  agent: IDictionary<string>,
  providerName: string,
  transformedResult: TransformedResult
): TransformedResult => {
  for (const trip of trips) {
    const { price, currency, itinToken, segments } = trip;
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

    const Leg = buildLegFromSegments(Segments);
    Legs.push(Leg);
    transformedResult.legs[Leg.id] = Leg;

    const redirectPayload: RedirectPayload = {
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url:
        'http://deeplink.tripmonster.com/Flights.aspx?' +
        querystring.stringify(payload)
    };

    const encodedPayload = encodeRedirectPayload(redirectPayload);

    const itinerary = buildItineraryFromLegs(Legs);

    itinerary.pricingOptions = [
      {
        agent: agent.id,
        agentName: agent.name,
        deepLink: encodedPayload,
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

export default oneWayTrip;
