import moment from 'moment';

import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

const oneWayTrip = (
  providerName: string,
  agent: IDictionary<string>,
  transformedResult: TransformedResult,
  inBoundTrips: any,
  metaURL: string,
  options: SearchOptions
): TransformedResult => {
  for (const trip of inBoundTrips) {
    const Legs: TransformedLeg[] = [];
    const segmentsBookingCodes = {};
    const Segments: TransformedSegment[] = [];
    const { PolicyInfo, ColunmInfoList } = trip;
    const { ShoppingID, PriceInfoList } = PolicyInfo[0];

    for (const item of ColunmInfoList) {
      const {
        DPort,
        APort,
        DDateStr,
        ADateStr,
        AirLine,
        Duration,
        FlightNo,
        BookingClass,
        CraftType
      } = item;
      const segment = buildSegment({
        origin: DPort.Code,
        destination: APort.Code,
        departure: moment
          .utc(DDateStr, 'YYYY-MM-DD HH:mm:ss')
          .format('YYYYMMDDHHmm'),
        arrival: moment
          .utc(ADateStr, 'YYYY-MM-DD HH:mm:ss')
          .format('YYYYMMDDHHmm'),
        marketingCarrier: AirLine.Code,
        operatingCarrier: AirLine.Code,
        duration: Duration,
        marketingFlightNumber: FlightNo,
        vehicleType: 'FLIGHT'
      });

      Segments.push(segment);
      transformedResult.codeShare[`${AirLine.Code}${FlightNo}`] = {
        marketingCarrier: AirLine.Code,
        operatingCarrier: AirLine.Code,
        aircraftType: CraftType
      };
      segmentsBookingCodes[segment.id] = {
        bookingCode: BookingClass
      };
      transformedResult.segments[segment.id] = segment;
    }

    const Leg = buildLegFromSegments(Segments);
    Legs.push(Leg);
    transformedResult.legs[Leg.id] = Leg;

    let priceAmount = 0;
    for (const priceInfo of PriceInfoList) {
      if (priceInfo.PassengerType === 'ADT') {
        priceAmount += priceInfo.TotalPrice * options.adults;
      } else if (priceInfo.PassengerType === 'CHD') {
        priceAmount += priceInfo.TotalPrice * options.children;
      } else if (priceInfo.PassengerType === 'INF') {
        priceAmount += priceInfo.TotalPrice * options.infants;
      }

      const itinerary = buildItineraryFromLegs(Legs);
      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: `https://${metaURL}&&amt=${priceAmount}&ouid=knkonajh&ShoppingID=${ShoppingID}&utm_source=travolic&utm_medium=referral&utm_campaign=${options.country}`
      });

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkPayload,
          price: {
            amount: priceAmount,
            currency: priceInfo.Currency
          },
          meta: {
            segments: segmentsBookingCodes
          }
        }
      ];

      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  }

  return transformedResult;
};

export default oneWayTrip;
