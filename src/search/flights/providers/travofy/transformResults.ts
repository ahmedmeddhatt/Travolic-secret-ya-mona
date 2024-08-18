import {
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs,
  encodeRedirectPayload,
  createConvertDateTime
} from '../../../../utils';

const providerName = 'travofy';
const convertDateTime = createConvertDateTime('DDMMYYHHmm');

const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName,
  isAirline: false
};

const transformResults = (
  options: SearchOptions,
  data: any
): TransformedResult => {
  const transformedResult: TransformedResult = {
    agents: {},
    itineraries: {},
    segments: {},
    legs: {},
    codeShare: {}
  };

  if (Object.keys(data).length === 0 || !data.listOfFlights) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  const { listOfFlights, flightSearchKey } = data;

  for (const flight of listOfFlights) {
    const { flightKey, flightPriceSummary, flightBookingSegmentTrips } = flight;
    const Legs: TransformedLeg[] = [];
    const segmentsBookingCodes = {};
    const baggage = [];

    for (const tripLeg of flightBookingSegmentTrips) {
      const { flightBookingSegments } = tripLeg;
      const Segments: TransformedSegment[] = [];

      for (const tripSegment of flightBookingSegments) {
        const {
          origin,
          destination,
          departureDateString,
          departureTime,
          arrivalDateString,
          arrivalTime,
          airlineCode,
          operatingAirline,
          flightNumber,
          rbd,
          baggageInfo,
          equipmentNumber
        } = tripSegment;
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin,
          destination,
          departure: convertDateTime(departureDateString + departureTime),
          arrival: convertDateTime(arrivalDateString + arrivalTime),
          marketingCarrier: airlineCode,
          operatingCarrier: operatingAirline,
          marketingFlightNumber: flightNumber,
          vehicleType: 'FLIGHT'
        };
        const segment = buildSegment(transFormedSegment);
        transformedResult.codeShare[`${airlineCode}${flightNumber}`] = {
          marketingCarrier: airlineCode,
          operatingCarrier: operatingAirline,
          aircraftType: equipmentNumber
        };

        Segments.push(segment);
        segmentsBookingCodes[segment.id] = {
          bookingCode: rbd
        };
        baggage.push(baggageInfo);
        transformedResult.segments[segment.id] = segment;
      }

      const leg = buildLegFromSegments(Segments);
      Legs.push(leg);
      transformedResult.legs[leg.id] = leg;
    }

    const itinerary = buildItineraryFromLegs(Legs);

    const deepLink = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      currency: flightPriceSummary.userSelectedCurrency,
      flightSearchKey,
      flightKey
    });

    itinerary.pricingOptions = [
      {
        agent: agent.id,
        agentName: agent.name,
        price: {
          amount:
            flightPriceSummary.subTotal *
            flightPriceSummary.userSelectedCurrencyConversionRate,
          currency: flightPriceSummary.userSelectedCurrency
        },
        deepLink,
        meta: {
          baggage: {
            totalPieces: baggage.length > 0 ? Math.max(...baggage) : undefined
          },
          segments: segmentsBookingCodes
        }
      }
    ];

    transformedResult.itineraries[itinerary.id] = itinerary;
  }

  return transformedResult;
};

export default transformResults;
