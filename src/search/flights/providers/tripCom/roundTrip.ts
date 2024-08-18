import moment from 'moment';

import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

const roundTrip = (
  providerName: string,
  agent: IDictionary<string>,
  transformedResult: TransformedResult,
  counter: number,
  inBoundTrips: any,
  outBoundTrips: any,
  metaURL: string,
  options: SearchOptions
): TransformedResult => {
  const inBoundLegs: TransformedLeg[] = [];
  const outBoundLegs: TransformedLeg[] = [];
  const segmentsBookingCodes = {};

  for (let index = 0; index <= counter - 1; index++) {
    const inBoundSegments: TransformedSegment[] = [];
    const outBoundSegments: TransformedSegment[] = [];

    for (const item of inBoundTrips[index].ColunmInfoList) {
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

      inBoundSegments.push(segment);

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

    const inBoundLeg = buildLegFromSegments(inBoundSegments);
    inBoundLeg['groupId'] = inBoundTrips[index].GroupID.split(',');
    inBoundLegs.push(inBoundLeg);
    transformedResult.legs[inBoundLeg.id] = inBoundLeg;

    for (const item of outBoundTrips[index].ColunmInfoList) {
      const {
        DPort,
        APort,
        DDateStr,
        ADateStr,
        AirLine,
        Duration,
        FlightNo,
        BookingClass
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

      outBoundSegments.push(segment);
      segmentsBookingCodes[segment.id] = {
        bookingCode: BookingClass
      };
      transformedResult.segments[segment.id] = segment;
    }

    const outBoundLeg = buildLegFromSegments(outBoundSegments);
    outBoundLeg['groupId'] = outBoundTrips[index].GroupID.split(',');
    outBoundLegs.push(outBoundLeg);
    transformedResult.legs[outBoundLeg.id] = outBoundLeg;
  }

  for (let index = 0; index <= counter - 1; index++) {
    const { ShoppingID, PriceInfoList } = outBoundTrips[index].PolicyInfo[0];

    let arrivalTotalPrice = 0;
    for (const priceInfo of PriceInfoList) {
      if (priceInfo.PassengerType === 'ADT') {
        arrivalTotalPrice += priceInfo.TotalPrice * options.adults;
      } else if (priceInfo.PassengerType === 'CHD') {
        arrivalTotalPrice += priceInfo.TotalPrice * options.children;
      } else if (priceInfo.PassengerType === 'INF') {
        arrivalTotalPrice += priceInfo.TotalPrice * options.infants;
      }

      const redirectPayload: RedirectPayload = {
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: `https://${metaURL}&amt=${arrivalTotalPrice}&ShoppingID=${ShoppingID}&utm_campaign=${options.country}`
      };

      const deepLinkPayload = encodeRedirectPayload(redirectPayload);

      for (const inBoundLeg of inBoundLegs) {
        for (const id of inBoundLeg['groupId']) {
          if (id === outBoundLegs[index]['groupId'][0]) {
            const Legs = [inBoundLeg, outBoundLegs[index]];
            const itinerary = buildItineraryFromLegs(Legs);
            itinerary.pricingOptions = [
              {
                agent: agent.id,
                agentName: agent.name,
                deepLink: deepLinkPayload,
                price: {
                  amount: arrivalTotalPrice,
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
      }
    }
  }

  return transformedResult;
};

export default roundTrip;
