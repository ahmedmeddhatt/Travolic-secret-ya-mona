import {
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs,
  encodeRedirectPayload
} from '../../../../utils';

import moment from 'moment';

const providerName = 'oneflightHub';

const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const transformResults = (
  options: SearchOptions,
  data: any
): TransformedResult => {
  const transformedResult: TransformedResult = {
    agents: {},
    segments: {},
    legs: {},
    itineraries: {},
    codeShare: {}
  };

  if (
    Object.keys(data).length === 0 ||
    data.airlines.length == 0 ||
    !data.airlines
  ) {
    transformedResult['error'] = 'No data found';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  if (options.tripType === 'oneway') {
    const { guid } = data['searchRQ']['generalInfo'];
    for (const item of data.airlines) {
      const refund = item['refundable'];
      const changeFee = item['cancellationCharges']['changePenalty'];
      const { id } = item;
      const Segments: TransformedSegment[] = [];
      const Legs: TransformedLeg[] = [];

      const outBoundSegment = item['segments'][0]['iSeg'];
      for (const outbound_journey of outBoundSegment) {
        const { dDat, aDat, aTime, dTime, ma, fn, AirlineNm, dApt, aApt } =
          outbound_journey;
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: dApt,
          destination: aApt,
          departure: moment.utc(`${dDat}T${dTime}`).format('YYYYMMDDHHmm'),
          arrival: moment.utc(`${aDat}T${aTime}`).format('YYYYMMDDHHmm'),
          marketingCarrier: ma,
          operatingCarrier: AirlineNm ? AirlineNm : ma,
          marketingFlightNumber: fn,
          vehicleType: 'FLIGHT'
        };
        transformedResult.codeShare[`${ma}${fn}`] = {
          marketingCarrier: ma,
          operatingCarrier: AirlineNm ? AirlineNm : ma
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
        url: `https://www.oneflighthub.com/Flight/FlightBooking?Guid=${guid}&FId=${id}&Source=travolic`
      });

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkPayload,
          price: {
            amount: item.totalAmt,
            currency: options.currency
          },
          meta: {
            restrictions: {
              refundable: refund,
              changePenalties: changeFee > '0.0' ? true : false
            }
          }
        }
      ];
      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  } else {
    const { guid } = data['searchRQ']['generalInfo'];
    for (const trip of data.airlines) {
      const refund = trip['refundable'];
      const changeFee = trip['cancellationCharges']['changePenalty'];
      const { id } = trip;
      const Legs: TransformedLeg[] = [];

      const outSegments: TransformedSegment[] = [];
      const segItem = trip['segments'][0];
      const outBoundSegment = trip['segments'][0]['iSeg'];

      const { airCraft } = segItem;
      for (const outbound_journey of outBoundSegment) {
        const { dDat, aDat, dTime, aTime, ma, fn, AirlineNm, dApt, aApt } =
          outbound_journey;
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: dApt,
          destination: aApt,
          departure: moment.utc(`${dDat}T${dTime}`).format('YYYYMMDDHHmm'),
          arrival: moment.utc(`${aDat}T${aTime}`).format('YYYYMMDDHHmm'),
          marketingCarrier: ma,
          operatingCarrier: AirlineNm,
          marketingFlightNumber: fn,
          vehicleType: 'FLIGHT'
        };
        transformedResult.codeShare[`${ma}${fn}`] = {
          marketingCarrier: ma,
          operatingCarrier: AirlineNm ? AirlineNm : ma,
          aircraftType: airCraft
        };
        const segment = buildSegment(transFormedSegment);
        outSegments.push(segment);
        transformedResult.segments[segment.id] = segment;
      }

      let Leg = buildLegFromSegments(outSegments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;

      const InSegments: TransformedSegment[] = [];
      const inBoundSegment = trip['segments'][1]['iSeg'];
      for (const inbound_journey of inBoundSegment) {
        const { dDat, aDat, ma, dTime, aTime, fn, AirlineNm, dApt, aApt } =
          inbound_journey;

        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: dApt,
          destination: aApt,
          departure: moment.utc(`${dDat}T${dTime}`).format('YYYYMMDDHHmm'),
          arrival: moment.utc(`${aDat}T${aTime}`).format('YYYYMMDDHHmm'),
          marketingCarrier: ma,
          operatingCarrier: AirlineNm ? AirlineNm : ma,
          marketingFlightNumber: fn,
          vehicleType: 'FLIGHT'
        };
        transformedResult.codeShare[`${ma}${fn}`] = {
          marketingCarrier: ma,
          operatingCarrier: AirlineNm ? AirlineNm : ma,
          aircraftType: airCraft
        };

        const segment = buildSegment(transFormedSegment);
        InSegments.push(segment);
        transformedResult.segments[segment.id] = segment;
      }

      Leg = buildLegFromSegments(InSegments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;

      const itinerary = buildItineraryFromLegs(Legs);
      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: `https://www.oneflighthub.com/Flight/FlightBooking?Guid=${guid}&FId=${id}&Source=travolic`
      });
      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkPayload,
          price: {
            amount: trip.totalAmt,
            currency: options.currency
          },
          meta: {
            restrictions: {
              refundable: refund,
              changePenalties: changeFee > '0.0' ? true : false
            }
          }
        }
      ];

      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  }
  return transformedResult;
};
export default transformResults;
