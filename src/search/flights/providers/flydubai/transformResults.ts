import moment from 'moment';
import querystring from 'query-string';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';
import currencies from './currencies';

const { FLYDUBAI_REDIRECT_URL } = process.env;

const cabinClassMap: IDictionary<string> = {
  Economy: 'LITE',
  Business: 'Business'
};

const providerName = 'flydubai';

const agent: IDictionary<string> = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const transformResults = (
  options: SearchOptions,
  data: any
): TransformedResult => {
  const transformedResult = {
    agents: {},
    legs: {},
    itineraries: {},
    segments: {},
    codeShare: {}
  };

  transformedResult.agents[agent.id] = agent;

  const { cabinClass, tripType, adults, children, infants, legs } = options;

  if (cabinClass == 'First' || cabinClass == 'Premium_Economy') {
    transformedResult['error'] =
      'First and Premium Economy are not available for this airline';
    return transformedResult;
  }

  if (Object.keys(data).length === 0) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  const result =
    data.RetrieveFareQuoteDateRangeResponse.RetrieveFareQuoteDateRangeResult;

  if (
    !data.RetrieveFareQuoteDateRangeResponse ||
    result.FlightSegments.FlightSegment.length === 0 ||
    result.FlightSegments.FlightSegment[0].LFID === 0
  ) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  const payload = {
    cabinClass,
    tripType: tripType == 'round' ? 'rt' : 'ow',
    adults,
    children,
    infants,
    isOriginMetro: false,
    isDestMetro: false,
    isoneway: undefined,
    originAirportCode: legs[0].origin,
    destinationAirportCode: legs[0].destination,
    departuredate: moment.utc(legs[0].departure),
    returndate: undefined
  };

  const passengers = `a${adults}c${children}i${infants}`;

  if (options.tripType == 'round') {
    const result =
      data.RetrieveFareQuoteDateRangeResponse.RetrieveFareQuoteDateRangeResult;

    payload.isoneway = false;
    payload.returndate = moment.utc(legs[1].departure);

    const url = `${FLYDUBAI_REDIRECT_URL}/rt/${passengers}/${legs[0].origin}_${
      legs[0].destination
    }/${moment.utc(legs[0].departure).format('YYYYMMDD')}_${moment
      .utc(legs[1].departure)
      .format('YYYYMMDD')}?${querystring.stringify(payload)}`;

    const segmentDetails = result.SegmentDetails.SegmentDetail;
    for (const segmentDetail of segmentDetails) {
      const Segments: TransformedSegment[] = [];
      const Legs: TransformedLeg[] = [];
      const { LFID } = segmentDetail;
      const craftType = result['LegDetails']['LegDetail'][0];
      const { EQP } = craftType;
      const {
        Origin,
        Destination,
        DepartureDate,
        ArrivalDate,
        OperatingCarrier,
        FlightNum
      } = segmentDetail;
      const transFormedSegment: TransformedSegmentWithoutID = {
        origin: Origin,
        destination: Destination,
        departure: moment.utc(DepartureDate).format('YYYYMMDDHHmm'),
        arrival: moment.utc(ArrivalDate).format('YYYYMMDDHHmm'),
        marketingCarrier: OperatingCarrier,
        operatingCarrier: OperatingCarrier,
        marketingFlightNumber: FlightNum,
        vehicleType: 'FLIGHT',
        aircraft: EQP
      };
      const segment = buildSegment(transFormedSegment);
      transformedResult.codeShare[`${OperatingCarrier}${FlightNum}`] = {
        marketingCarrier: OperatingCarrier,
        operatingCarrier: OperatingCarrier,
        aircraftType: EQP
      };

      Segments.push(segment);
      transformedResult.segments[segment.id] = segment;

      const Leg = buildLegFromSegments(Segments);
      Leg['LFID'] = LFID;
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;

      const itinerary = buildItineraryFromLegs(Legs);
      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url
      });

      for (const leg of Legs) {
        for (const flightSegment of result.FlightSegments.FlightSegment) {
          if (flightSegment.LFID === leg['LFID']) {
            const fares = flightSegment.FareTypes.FareType;
            for (const fare of fares) {
              const changeFee =
                fare['FareInfos']['FareInfo'][0]['Pax'][0]['Penalties'][
                  'ChangeFees'
                ]['ChangeFee'][0]['Percentage'] > '0'
                  ? true
                  : false;
              const refund =
                (fare['FareInfos']['FareInfo'][0]['Pax'][0]['Penalties'][
                  'CancellationFees'
                ]['RefundPenalty'][0]['Percentage'] ||
                  fare['FareInfos']['FareInfo'][0]['Pax'][0]['Penalties'][
                    'CancellationFees'
                  ]['RefundPenalty'][0]['Amount']) > '0'
                  ? false
                  : true;

              if (fare.FareTypeName === cabinClassMap[options.cabinClass]) {
                itinerary.pricingOptions.push({
                  agent: agent.id,
                  agentName: agent.name,
                  deepLink: deepLinkPayload,
                  price: {
                    amount:
                      fare.FareInfos.FareInfo[0].Pax[0].BaseFareAmtInclTax,
                    currency:
                      currencies[options.legs[0].origin] == undefined
                        ? 'AED'
                        : currencies[options.legs[0].origin]
                  },
                  meta: {
                    restrictions: {
                      refundable: refund,
                      changePenalties: changeFee
                    }
                  }
                });
              }
            }
          }
        }
      }
      if (itinerary.pricingOptions.length !== 0) {
        transformedResult.itineraries[itinerary.id] = itinerary;
      }
    }
  } else {
    payload.isoneway = true;
    const url = `${FLYDUBAI_REDIRECT_URL}/ow/${passengers}/${legs[0].origin}_${
      legs[0].destination
    }/${moment
      .utc(legs[0].departure)
      .format('YYYYMMDD')}?${querystring.stringify(payload)}`;

    const segmentDetails = result.SegmentDetails.SegmentDetail;
    for (const segmentDetail of segmentDetails) {
      const item = result['LegDetails']['LegDetail'][0];
      const { EQP } = item;
      const Segments: TransformedSegment[] = [];
      const Legs: TransformedLeg[] = [];
      const {
        Origin,
        Destination,
        DepartureDate,
        ArrivalDate,
        OperatingCarrier,
        FlightNum,
        LFID
      } = segmentDetail;
      const transFormedSegment: TransformedSegmentWithoutID = {
        origin: Origin,
        destination: Destination,
        departure: moment.utc(DepartureDate).format('YYYYMMDDHHmm'),
        arrival: moment.utc(ArrivalDate).format('YYYYMMDDHHmm'),
        marketingCarrier: OperatingCarrier,
        operatingCarrier: OperatingCarrier,
        marketingFlightNumber: FlightNum,
        vehicleType: 'FLIGHT',
        aircraft: EQP
      };
      const segment = buildSegment(transFormedSegment);
      transformedResult.codeShare[`${OperatingCarrier}${FlightNum}`] = {
        marketingCarrier: OperatingCarrier,
        aircarftType: EQP
      };

      Segments.push(segment);
      transformedResult.segments[segment.id] = segment;

      const Leg = buildLegFromSegments(Segments);

      Leg['LFID'] = LFID;
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;

      const itinerary = buildItineraryFromLegs(Legs);
      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url
      });
      const flightSegments = result.FlightSegments.FlightSegment;

      for (const leg of Legs) {
        for (const flightSegment of flightSegments) {
          if (flightSegment.LFID === leg['LFID']) {
            const fares = flightSegment.FareTypes.FareType;

            for (const fare of fares) {
              const changeFee =
                fare['FareInfos']['FareInfo'][0]['Pax'][0]['Penalties'][
                  'ChangeFees'
                ]['ChangeFee'][0]['Percentage'] > '0'
                  ? true
                  : false;
              const refund =
                (fare['FareInfos']['FareInfo'][0]['Pax'][0]['Penalties'][
                  'CancellationFees'
                ]['RefundPenalty'][0]['Percentage'] ||
                  fare['FareInfos']['FareInfo'][0]['Pax'][0]['Penalties'][
                    'CancellationFees'
                  ]['RefundPenalty'][0]['Amount']) > '0'
                  ? false
                  : true;

              if (fare.FareTypeName === cabinClassMap[options.cabinClass]) {
                itinerary.pricingOptions.push({
                  agent: agent.id,
                  agentName: agent.name,
                  deepLink: deepLinkPayload,
                  price: {
                    amount:
                      fare.FareInfos.FareInfo[0].Pax[0].BaseFareAmtInclTax,
                    currency:
                      currencies[options.legs[0].origin] == undefined
                        ? 'AED'
                        : currencies[options.legs[0].origin]
                  },
                  meta: {
                    restrictions: {
                      refundable: refund,
                      changePenalties: changeFee
                    }
                  }
                });
              }
            }
          }
        }
      }

      if (itinerary.pricingOptions.length !== 0) {
        transformedResult.itineraries[itinerary.id] = itinerary;
      }
    }
  }
  return transformedResult;
};

export default transformResults;
