import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';
import moment from 'moment';

const roundTrip = (
  trips: any,
  providerName: string,
  agent: IDictionary<string>,
  currency: string,
  transformedResult: TransformedResult
): TransformedResult => {
  for (const trip of trips) {
    const { price, deep_link, route: flights } = trip;
    const outBoundLegs: TransformedLeg[] = [];
    const inBoundLegs: TransformedLeg[] = [];
    const outBoundSegments: TransformedSegment[] = [];
    const inBoundSegments: TransformedSegment[] = [];
    for (const flight of flights) {
      if (flight.return === 0) {
        const {
          flyFrom,
          flyTo,
          local_departure,
          local_arrival,
          airline,
          operating_carrier,
          flight_no
        } = flight;

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
          marketingFlightNumber: flight_no,
          vehicleType: 'FLIGHT'
        };
        const segment = buildSegment(transFormedSegment);

        outBoundSegments.push(segment);
        transformedResult.codeShare[`${airline}${flight_no}`] = {
          marketingCarrier: airline,
          operatingCarrier: operating_carrier ? operating_carrier : airline
        };
        transformedResult.segments[segment.id] = segment;
      } else {
        const {
          flyFrom,
          flyTo,
          local_departure,
          local_arrival,
          airline,
          operating_carrier,
          flight_no
        } = flight;

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
          marketingFlightNumber: flight_no,
          vehicleType: 'FLIGHT'
        };
        const segment = buildSegment(transFormedSegment);

        inBoundSegments.push(segment);
        transformedResult.codeShare[`${airline}${flight_no}`] = {
          marketingCarrier: airline,
          operatingCarrier: operating_carrier ? operating_carrier : airline
        };
        transformedResult.segments[segment.id] = segment;
      }
    }

    const outBoundLeg = buildLegFromSegments(outBoundSegments);
    const inBoundLeg = buildLegFromSegments(inBoundSegments);

    outBoundLegs.push(outBoundLeg);
    inBoundLegs.push(inBoundLeg);

    transformedResult.legs[outBoundLeg.id] = outBoundLeg;
    transformedResult.legs[inBoundLeg.id] = inBoundLeg;

    const encodedPayload = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url: deep_link
    });

    const tripItineraryObj = {
      agent: agent.id,
      agentName: agent.name,
      deepLink: encodedPayload,
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

    const itinerary = buildItineraryFromLegs([outBoundLegs[0], inBoundLegs[0]]);

    itinerary.pricingOptions = [tripItineraryObj];

    transformedResult.itineraries[itinerary.id] = itinerary;
  }

  return transformedResult;
};

export default roundTrip;
