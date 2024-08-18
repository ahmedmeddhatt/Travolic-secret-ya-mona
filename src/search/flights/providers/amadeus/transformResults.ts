import moment from 'moment';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

const providerName = 'amadeus';

const transformResults = (
  options: SearchOptions,
  data: any
): TransformedResult => {
  const transformedResult: TransformedResult = {
    agents: {},
    legs: {},
    itineraries: {},
    segments: {},
    codeShare: {},
    flightDetails: data
  };

  if (!data.results || data.results.length === 0) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  for (const result of data.results) {
    const { merchant, bounds, deep_link, fare } = result;
    const agntName = data.meta.carriers[merchant].name;

    if (agntName === 'British Airways') continue;
    if (options.tripType === 'multi' && agntName === 'EgyptAir') continue;

    const agent = {
      id: Buffer.from(agntName).toString('base64'),
      name: agntName,
      iataCode: merchant,
      isAirline: true
    };

    transformedResult.agents[agent.id] = agent;

    const Legs: TransformedLeg[] = [];
    const segmentsBookingCodes = {};
    const baggage = [];

    for (const bound of bounds) {
      if (!bound || bound.length === 0 || bound.flights.length === 0) {
        return;
      }

      const Segments: TransformedSegment[] = [];
      const { flights, included_checked_bags } = bound;

      for (const flight of flights) {
        const {
          origin,
          destination,
          departs_at,
          arrives_at,
          marketing_airline,
          operating_airline,
          flight_number,
          booking_infos,
          aircraft
        } = flight;
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: origin.airport,
          destination: destination.airport,
          departure: moment
            .utc(departs_at.slice(0, 19), 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(arrives_at.slice(0, 19), 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),
          marketingCarrier: marketing_airline,
          operatingCarrier: operating_airline,
          marketingFlightNumber: flight_number,
          vehicleType: 'FLIGHT',
          aircraft
        };
        const segment = buildSegment(transFormedSegment);

        Segments.push(segment);
        segmentsBookingCodes[segment.id] = {
          bookingCode: booking_infos[0].booking_code
        };
        transformedResult.codeShare[`${marketing_airline}${flight_number}`] = {
          marketingCarrier: marketing_airline,
          operatingCarrier: operating_airline
            ? operating_airline
            : marketing_airline,
          aircraftType: aircraft
        };
        transformedResult.segments[segment.id] = segment;
      }

      const leg = buildLegFromSegments(Segments);
      Legs.push(leg);
      if (
        included_checked_bags &&
        included_checked_bags.length > 0 &&
        Object.keys(included_checked_bags[0]).includes('type') &&
        included_checked_bags[0].type !== (null || '') &&
        included_checked_bags[0].type === 'piece' &&
        Object.keys(included_checked_bags[0]).includes('quantity') &&
        included_checked_bags[0].quantity !== (null || '') &&
        included_checked_bags[0].quantity > 0
      ) {
        baggage.push(Number(included_checked_bags[0].quantity));
      }
      transformedResult.legs[leg.id] = leg;
    }

    const itinerary = buildItineraryFromLegs(Legs);

    const deepLinkPayload = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url: deep_link
    });

    const metaBaggage = {};
    if (baggage.length > 0) {
      metaBaggage['totalBaggages'] = Math.max(...baggage);
    }

    itinerary.pricingOptions = [
      {
        agent: agent.id,
        agentName: agent.name,
        price: {
          amount: parseFloat(fare.itinerary_price.total_fare),
          currency: fare.currency
        },
        deepLink: deepLinkPayload,
        meta: {
          restrictions: {
            refundable: fare.restrictions.refundable,
            changePenalties: fare.restrictions.change_penalties
          },
          baggage:
            Object.keys(metaBaggage).length > 0 ? metaBaggage : undefined,
          segments: segmentsBookingCodes
        }
      }
    ];

    if (transformedResult.itineraries[itinerary.id] != null) {
      if (
        parseFloat(fare.itinerary_price.total_fare) <
        transformedResult.itineraries[itinerary.id].pricingOptions[0].price
          .amount
      ) {
        transformedResult.itineraries[itinerary.id] = itinerary;
      }
    } else {
      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  }

  return transformedResult;
};

export default transformResults;
