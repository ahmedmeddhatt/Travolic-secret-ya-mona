import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';
import moment from 'moment';

const multiTrip = (
  trips: any,
  providerName: string,
  agent: IDictionary<string>,
  currency: string,
  transformedResult: TransformedResult
): TransformedResult => {
  for (const trip of trips) {
    const { price, deep_link } = trip;
    const Legs: TransformedLeg[] = [];
    for (const flight of trip.route) {
      const Segments: TransformedSegment[] = [];

      for (const route of flight.route) {
        const {
          flyFrom,
          flyTo,
          local_departure,
          local_arrival,
          operating_carrier,
          flight_no,
          airline
        } = route;
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: flyFrom,
          destination: flyTo,
          departure: moment
            .utc(local_departure, 'YYYY-MM-DD HH:mm')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(local_arrival, 'YYYY-MM-DD HH:mm')
            .format('YYYYMMDDHHmm'),
          marketingCarrier: airline,
          operatingCarrier: operating_carrier ? operating_carrier : airline,
          marketingFlightNumber: flight_no
        };
        const segment = buildSegment(transFormedSegment);

        Segments.push(segment);
        transformedResult.codeShare[`${airline}${flight_no}`] = {
          marketingCarrier: airline,
          operatingCarrier: operating_carrier ? operating_carrier : airline
        };
        transformedResult.segments[segment.id] = segment;
      }

      const Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
    }

    const deepLinkPayload = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url: deep_link
    });

    const tripItineraryObj = {
      agent: agent.id,
      agentName: agent.name,
      deepLink: deepLinkPayload,
      price: {
        amount: parseFloat(price),
        currency
      }
    };

    const HandbagesInKilos = Number(trip.baglimit.hand_weight),
      BaggagesInKilos = Number(trip.baglimit.hold_weight);
    if (
      (HandbagesInKilos && typeof HandbagesInKilos === 'number') ||
      (BaggagesInKilos && typeof BaggagesInKilos === 'number')
    ) {
      tripItineraryObj['meta'] = {
        baggage: {
          HandbagesInKilos:
            HandbagesInKilos && typeof HandbagesInKilos === 'number'
              ? HandbagesInKilos
              : undefined,
          BaggagesInKilos:
            BaggagesInKilos && typeof BaggagesInKilos === 'number'
              ? BaggagesInKilos
              : undefined
        }
      };
    }

    const itinerary = buildItineraryFromLegs(Legs);
    itinerary.pricingOptions = [tripItineraryObj];
    transformedResult.itineraries[itinerary.id] = itinerary;
  }

  return transformedResult;
};

export default multiTrip;
