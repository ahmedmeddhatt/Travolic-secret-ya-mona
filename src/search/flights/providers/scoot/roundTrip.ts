import moment from 'moment';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

const roundTrip = (
  transformedResult: TransformedResult,
  trips: any,
  providerName: string,
  agent: any,
  deepLink: string
): TransformedResult => {
  const inBoundFlights = [];
  const outBoundFlights = [];

  trips.forEach((trip: any, index: number) => {
    const flightLegs =
      trip.DateMarketLowFareList[0].DateMarketLowFare[0]
        .DateFlightLowFareList[0].DateFlightLowFare;

    const Legs: TransformedLeg[] = [];

    for (const flightLeg of flightLegs) {
      const price =
        parseFloat(flightLeg.FareAmount[0]) +
        parseFloat(flightLeg.TaxesAndFeesAmount[0]);

      if (price != 0) {
        const Segments: TransformedSegment[] = [];

        for (const seg of flightLeg.DateFlightLegList[0].DateFlightLeg) {
          const {
            DepartureStation,
            ArrivalStation,
            STD,
            STA,
            CarrierCode,
            OperatingCarrier,
            FlightNumber
          } = seg;
          const transFormedSegment: TransformedSegmentWithoutID = {
            origin: DepartureStation[0],
            destination: ArrivalStation[0],
            departure: moment.utc(STD[0]).format('YYYYMMDDHHmm'),
            arrival: moment.utc(STA[0]).format('YYYYMMDDHHmm'),
            marketingCarrier: CarrierCode[0],
            operatingCarrier: OperatingCarrier[0],
            marketingFlightNumber: FlightNumber[0],
            vehicleType: 'FLIGHT'
          };
          const segment = buildSegment(transFormedSegment);

          Segments.push(segment);
          transformedResult.segments[segment.id] = segment;
        }

        const Leg = buildLegFromSegments(Segments);

        Leg['price'] = price;
        Leg['currency'] =
          trip.DateMarketLowFareList[0].DateMarketLowFare[0].CurrencyCode[0];
        Legs.push(Leg);

        index == 0 ? outBoundFlights.push(Leg) : inBoundFlights.push(Leg);

        transformedResult.legs[Leg.id] = Leg;
      }
    }
  });

  for (const outBoundFlight of outBoundFlights) {
    for (const inBoundFlight of inBoundFlights) {
      const Legs: TransformedLeg[] = [outBoundFlight, inBoundFlight];

      const itinerary = buildItineraryFromLegs(Legs);
      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: deepLink
      });

      itinerary.pricingOptions.push({
        agent: agent.id,
        agentName: agent.name,
        deepLink: deepLinkPayload,
        price: {
          amount: outBoundFlight.price + inBoundFlight.price,
          currency: outBoundFlight.currency
        }
      });
      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  }

  return transformedResult;
};

export default roundTrip;
