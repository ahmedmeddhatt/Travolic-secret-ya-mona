import {
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs,
  encodeRedirectPayload,
  createConvertDateTime
} from '../../../../utils';

const convertDateTime = createConvertDateTime('YYYY-MM-DDHH:mm:ss');

const multiTrip = (
  providerName: string,
  agent: IDictionary<string>,
  trips: any,
  legs: number,
  transformedResult: TransformedResult
): TransformedResult => {
  for (const trip of trips) {
    const { price, deeplinkURL } = trip;
    const Legs: TransformedLeg[] = [];
    const segmentsBookingCodes = {};
    const totalBaggages = [];
    const totalHandBaggages = [];

    for (let i = 0; i < legs; i++) {
      const Segments: TransformedSegment[] = [];
      const outBoundLegs = trip[`outBoundLeg${[i]}`];

      if (Array.isArray(outBoundLegs)) {
        for (const outBoundLeg of outBoundLegs) {
          const { flightSegment } = outBoundLeg.segments;
          const {
            arrDate,
            arrTime,
            depTime,
            depDate,
            origin,
            destination,
            airLineCode,
            flightNumber,
            bookingClass
          } = flightSegment;
          let { adultHandBaggage, adultCheckinBaggage } = flightSegment;

          const transFormedSegment: TransformedSegmentWithoutID = {
            origin,
            destination,
            departure: convertDateTime(depDate + depTime),
            arrival: convertDateTime(arrDate + arrTime),
            marketingCarrier: airLineCode,
            operatingCarrier: flightNumber.OperatedByCode,
            marketingFlightNumber: flightNumber.number,
            vehicleType: 'FLIGHT'
          };

          const segment = buildSegment(transFormedSegment);

          Segments.push(segment);
          segmentsBookingCodes[segment.id] = {
            bookingCode: bookingClass
          };
          transformedResult.codeShare[`${airLineCode}${flightNumber.number}`] =
            {
              marketingCarrier: airLineCode,
              operatingCarrier: flightNumber.OperatedByCode
            };

          adultCheckinBaggage = adultCheckinBaggage.split(' ')[1];
          adultHandBaggage =
            adultHandBaggage === 'No Baggage'
              ? ''
              : adultHandBaggage.split(' ')[0].split('-')[1];

          totalBaggages.push(Number(adultCheckinBaggage));
          totalHandBaggages.push(Number(adultHandBaggage));

          transformedResult.segments[segment.id] = segment;
        }
      } else {
        const { flightSegment } = outBoundLegs.segments;
        const {
          arrDate,
          arrTime,
          depTime,
          depDate,
          origin,
          destination,
          airLineCode,
          flightNumber,
          bookingClass
        } = flightSegment;
        let { adultHandBaggage, adultCheckinBaggage } = flightSegment;

        const transFormedSegment: TransformedSegmentWithoutID = {
          origin,
          destination,
          departure: convertDateTime(depDate + depTime),
          arrival: convertDateTime(arrDate + arrTime),
          marketingCarrier: airLineCode,
          operatingCarrier: flightNumber.OperatedByCode,
          marketingFlightNumber: flightNumber.number,
          vehicleType: 'FLIGHT'
        };

        const segment = buildSegment(transFormedSegment);

        Segments.push(segment);
        segmentsBookingCodes[segment.id] = {
          bookingCode: bookingClass
        };
        transformedResult.codeShare[`${airLineCode}${flightNumber.number}`] = {
          marketingCarrier: airLineCode,
          operatingCarrier: flightNumber.OperatedByCode
        };

        adultCheckinBaggage = adultCheckinBaggage.split(' ')[1];
        adultHandBaggage =
          adultHandBaggage === 'No Baggage'
            ? ''
            : adultHandBaggage.split(' ')[0].split('-')[1];

        totalBaggages.push(Number(adultCheckinBaggage));
        totalHandBaggages.push(Number(adultHandBaggage));

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
      currency: price.currencyCode,
      url: `${deeplinkURL.baseURL}${deeplinkURL.param1}&${deeplinkURL.param2}&utm_source=${deeplinkURL.param3}&utm_medium=${deeplinkURL.param4}&partner=Travelwings`
    });

    itinerary.pricingOptions = [
      {
        agent: agent.id,
        agentName: agent.name,
        price: {
          amount: price.totalAmount,
          currency: price.currencyCode
        },
        deepLink,
        meta: {
          baggage: {
            totalBaggages:
              totalBaggages.length > 0 ? Math.max(...totalBaggages) : undefined,
            totalHandbages:
              totalHandBaggages.length > 0
                ? Math.max(...totalHandBaggages)
                : undefined
          },

          segments: segmentsBookingCodes
        }
      }
    ];

    transformedResult.itineraries[itinerary.id] = itinerary;
  }

  return transformedResult;
};

export default multiTrip;
