import moment from 'moment';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

const oneWayTrip = (
  transformedResult: TransformedResult,
  trips: any,
  providerName: string,
  agent: any,
  deepLink: string
): TransformedResult => {
  for (const trip of trips) {
    const flightLegs =
      trip.DateMarketLowFareList[0].DateMarketLowFare[0]
        .DateFlightLowFareList[0].DateFlightLowFare;

    for (const flightLeg of flightLegs) {
      const Legs: TransformedLeg[] = [];
      const price =
        parseFloat(flightLeg.FareAmount[0]) +
        parseFloat(flightLeg.TaxesAndFeesAmount[0]);

      if (price !== 0) {
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

        Legs.push(Leg);
        transformedResult.legs[Leg.id] = Leg;

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
            amount: price,
            currency:
              trip.DateMarketLowFareList[0].DateMarketLowFare[0].CurrencyCode[0]
          }
        });
        transformedResult.itineraries[itinerary.id] = itinerary;
      }
    }
  }

  return transformedResult;
};

export default oneWayTrip;
