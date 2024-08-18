import moment from 'moment';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

const roundTrip = (
  transformedResult: TransformedResult,
  providerName: string,
  data: any
): TransformedResult => {
  for (const item of data) {
    const { data, provider } = item;

    if (data.flights.length === 0 || !data.flights) {
      continue;
    }

    const agent: IDictionary<string> = {
      id: Buffer.from(provider).toString('base64'),
      name: provider
    };

    transformedResult.agents[agent.id] = agent;

    for (const flight of data.flights) {
      const Legs: TransformedLeg[] = [];
      let Segments: TransformedSegment[] = [];

      for (const segmentData of flight.outbound.segments) {
        const {
          departureDateTime,
          departureAirportCode,
          arrivalDateTime,
          arrivalAirportCode,
          flightNumber,
          carrier
        } = segmentData;

        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: departureAirportCode,
          destination: arrivalAirportCode,
          departure: moment
            .utc(departureDateTime, 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(arrivalDateTime, 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),
          marketingCarrier: carrier,
          marketingFlightNumber: flightNumber,
          operatingCarrier: flight.operatingCarrier
            ? flight.operatingCarrier
            : carrier,
          vehicleType: 'FLIGHT'
        };

        const segment = buildSegment(transFormedSegment);

        if (flight.operatingCarrier) {
          transformedResult.codeShare[`${carrier}${flightNumber}`] = {
            marketingCarrier: carrier,
            operatingCarrier: flight.operatingCarrier
          };
        }

        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
      }

      let Leg = buildLegFromSegments(Segments);

      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;

      Segments = [];

      for (const segmentData of flight.inbound.segments) {
        const {
          departureDateTime,
          departureAirportCode,
          arrivalDateTime,
          arrivalAirportCode,
          flightNumber,
          carrier
        } = segmentData;

        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: departureAirportCode,
          destination: arrivalAirportCode,
          departure: moment
            .utc(departureDateTime, 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(arrivalDateTime, 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),
          marketingCarrier: carrier,
          marketingFlightNumber: flightNumber,
          operatingCarrier: flight.operatingCarrier
            ? flight.operatingCarrier
            : carrier,
          vehicleType: 'FLIGHT'
        };

        const segment = buildSegment(transFormedSegment);

        if (flight.operatingCarrier) {
          transformedResult.codeShare[`${carrier}${flightNumber}`] = {
            marketingCarrier: carrier,
            operatingCarrier: flight.operatingCarrier
          };
        }

        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
      }

      Leg = buildLegFromSegments(Segments);

      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;

      const itinerary = buildItineraryFromLegs(Legs);
      const encodedPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: flight.deepLink
      });

      const pricingOption = {
        agent: agent.id,
        agentName: agent.name,
        deepLink: encodedPayload,
        price: {
          amount: flight.totalPrice,
          currency: flight.currency
        }
      };

      if (transformedResult.itineraries[itinerary.id]) {
        let found = false;
        for (
          let index = 0;
          index <
          transformedResult.itineraries[itinerary.id].pricingOptions.length;
          index++
        ) {
          if (
            transformedResult.itineraries[itinerary.id].pricingOptions[index]
              .price.amount == pricingOption.price.amount
          ) {
            found = true;
            break;
          }
        }
        if (found == false) {
          transformedResult.itineraries[itinerary.id].pricingOptions.push(
            pricingOption
          );
        }
      } else {
        transformedResult.itineraries[itinerary.id] = itinerary;
        transformedResult.itineraries[itinerary.id].pricingOptions = [
          pricingOption
        ];
      }
    }
  }

  return transformedResult;
};

export default roundTrip;
