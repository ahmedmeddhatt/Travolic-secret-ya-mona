import {
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs,
  encodeRedirectPayload,
  createConvertDateTime
} from '../../../../utils';

const convertDateTime = createConvertDateTime('YYYY-MM-DDHH:mm:ss');

const roundTrip = (
  providerName: string,
  agent: IDictionary<string>,
  trips: any,
  transformedResult: TransformedResult
): TransformedResult => {
  for (const trip of trips) {
    const {
      outBoundLeg: outBoundLegs,
      inboundLeg: inBoundLegs,
      price,
      deeplinkURL
    } = trip;
    const Legs: TransformedLeg[] = [];
    const inBoundSegments: TransformedSegment[] = [];
    const outBoundSegments: TransformedSegment[] = [];
    const segmentsBookingCodes = {};
    const totalBaggages = [];
    const totalHandBaggages = [];

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

        outBoundSegments.push(segment);
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

      outBoundSegments.push(segment);
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

    let leg = buildLegFromSegments(outBoundSegments);

    Legs.push(leg);
    transformedResult.legs[leg.id] = leg;

    if (Array.isArray(inBoundLegs)) {
      for (const inBoundLeg of inBoundLegs) {
        const { flightSegment } = inBoundLeg.segments;
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
          marketingFlightNumber: flightNumber.number
        };

        const segment = buildSegment(transFormedSegment);

        inBoundSegments.push(segment);
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
    } else {
      const { flightSegment } = inBoundLegs.segments;
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
        marketingFlightNumber: flightNumber.number
      };

      const segment = buildSegment(transFormedSegment);

      inBoundSegments.push(segment);
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

    leg = buildLegFromSegments(inBoundSegments);
    Legs.push(leg);
    transformedResult.legs[leg.id] = leg;

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
          restrictions: {
            refundable: price.refundableInfo.split('')[0] === 'R' ? true : false
          },
          segments: segmentsBookingCodes
        }
      }
    ];

    transformedResult.itineraries[itinerary.id] = itinerary;
  }

  return transformedResult;
};

export default roundTrip;
