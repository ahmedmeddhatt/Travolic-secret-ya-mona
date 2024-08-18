import moment from 'moment';
import {
  buildItineraryFromLegs,
  buildLegFromSegments,
  buildSegment,
  encodeRedirectPayload
} from '../../../../utils';

const providerName = 'Omio';

const transformResults = async (
  options: SearchTrainOptions,
  interceptedData: any
): Promise<TransformedTrainResult> => {
  const { data, stations, carriers, dumpStations, dumpCarriers } =
    interceptedData;
  const transformedResult: TransformedTrainResult = {
    agents: {},
    legs: {},
    outboundItineraries: {},
    inboundItineraries: {},
    segments: {},
    amenities: {},
    stations: stations,
    carriers: carriers
  };

  if (
    Object.keys(data).length === 0 ||
    !data['segments'] ||
    !data['positions'] ||
    !data['carriers'] ||
    !data['journeys']
  ) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  const { journeys, currency } = data;

  // const stationsMap = data.positions.reduce((acc: any, position: any) => {
  //   acc[position.id] = position;
  //   return acc;
  // }, {});
  // const carriersMap = data.carriers.reduce((acc: any, carrier: any) => {
  //   acc[carrier.id] = carrier;
  //   return acc;
  // }, {});
  const providersMap = data.providers.reduce((acc: any, provider: any) => {
    acc[provider.id] = provider;
    return acc;
  }, {});
  const segmentsMap = data.segments.reduce((acc: any, segment: any) => {
    acc[segment.id] = segment;
    return acc;
  }, {});

  if (options.tripType === 'oneway') {
    for (const journey of journeys) {
      const Segments: TransformedSegment[] = [];
      const { segmentIds } = journey.outbound;
      const { providerId } = journey.offers[0];
      const provider = providersMap[providerId];
      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: provider.id,
        agentName: provider.name,
        url: journey.offers[0].link
      });

      transformedResult.agents[provider.id] = provider;

      for (const segmentId of segmentIds) {
        const segment = segmentsMap[segmentId];
        const {
          travelMode,
          departureTime,
          arrivalTime,
          departurePositionId,
          arrivalPositionId,
          transportId,
          carrierId
        } = segment;
        const origin = dumpStations[departurePositionId];
        const destination = dumpStations[arrivalPositionId];
        const carrier = dumpCarriers[carrierId];

        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: origin.code,
          destination: destination.code,
          departure: moment
            .utc(departureTime, 'YYYY-MM-DD HH:mm')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(arrivalTime, 'YYYY-MM-DD HH:mm')
            .format('YYYYMMDDHHmm'),
          marketingCarrier: carrier.code,
          operatingCarrier: carrier.code,
          trainNumber: transportId,
          vehicleType: travelMode
        };
        const Segment = buildSegment(transFormedSegment);

        Segments.push(Segment);
        transformedResult.segments[Segment.id] = Segment;
      }

      const Leg = buildLegFromSegments(Segments);

      transformedResult.legs[Leg.id] = Leg;

      const outboundItinerary = buildItineraryFromLegs([Leg]);

      outboundItinerary.pricingOptions = [
        {
          agent: provider.id,
          agentName: provider.name,
          deepLink: deepLinkPayload,
          price: {
            amount: journey.cheapestPriceCents * 0.01,
            currency: currency,
            type: 'itinerary'
          }
        }
      ];

      transformedResult.outboundItineraries[outboundItinerary.id] =
        outboundItinerary;
    }
  } else {
    for (const journey of journeys) {
      let Segments: TransformedSegment[] = [];
      const { segmentIds: outboundSegmentIds } = journey.outbound;
      const { segmentIds: inboundSegmentIds } = journey.inbound;
      const { providerId } = journey.offers[0];
      const provider = providersMap[providerId];

      const agent = {
        id: Buffer.from(provider.name).toString('base64'),
        name: provider.name
      };
      transformedResult.agents[agent.id] = agent;
      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: journey.offers[0].link
      });

      for (const segmentId of outboundSegmentIds) {
        const segment = segmentsMap[segmentId];

        const {
          travelMode,
          departureTime,
          arrivalTime,
          departurePositionId,
          arrivalPositionId,
          transportId,
          carrierId
        } = segment;

        const origin = dumpStations[departurePositionId];
        const destination = dumpStations[arrivalPositionId];
        const carrier = dumpCarriers[carrierId];

        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: origin.code,
          destination: destination.code,
          departure: moment
            .utc(departureTime, 'YYYY-MM-DD HH:mm')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(arrivalTime, 'YYYY-MM-DD HH:mm')
            .format('YYYYMMDDHHmm'),
          marketingCarrier: carrier.code,
          operatingCarrier: carrier.code,
          trainNumber: transportId,
          vehicleType: travelMode
        };
        const Segment = buildSegment(transFormedSegment);

        Segments.push(Segment);
        transformedResult.segments[Segment.id] = Segment;
      }

      const outboundLeg = buildLegFromSegments(Segments);

      transformedResult.legs[outboundLeg.id] = outboundLeg;

      const outboundItinerary = buildItineraryFromLegs([outboundLeg]);

      outboundItinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkPayload,
          price: {
            amount: journey.cheapestPriceCents * 0.01,
            currency: currency,
            type: 'itinerary'
          }
        }
      ];
      transformedResult.outboundItineraries[outboundItinerary.id] =
        outboundItinerary;

      Segments = [];

      for (const segmentId of inboundSegmentIds) {
        const segment = segmentsMap[segmentId];

        const {
          travelMode,
          departureTime,
          arrivalTime,
          departurePositionId,
          arrivalPositionId,
          transportId,
          carrierId
        } = segment;

        const origin = dumpStations[departurePositionId];
        const destination = dumpStations[arrivalPositionId];
        const carrier = dumpCarriers[carrierId];

        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: origin.code,
          destination: destination.code,
          departure: moment
            .utc(departureTime, 'YYYY-MM-DD HH:mm')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(arrivalTime, 'YYYY-MM-DD HH:mm')
            .format('YYYYMMDDHHmm'),
          marketingCarrier: carrier.code,
          operatingCarrier: carrier.code,
          trainNumber: transportId,
          vehicleType: travelMode
        };
        const Segment = buildSegment(transFormedSegment);

        Segments.push(Segment);
        transformedResult.segments[Segment.id] = Segment;
      }

      const inboundLeg = buildLegFromSegments(Segments);

      transformedResult.legs[inboundLeg.id] = inboundLeg;

      const inboundItinerary = buildItineraryFromLegs([inboundLeg]);

      inboundItinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkPayload,
          price: {
            amount: journey.cheapestPriceCents * 0.01,
            currency: currency,
            type: 'itinerary'
          }
        }
      ];

      outboundItinerary.linkedItineraries = [inboundItinerary.id];

      transformedResult.inboundItineraries[inboundItinerary.id] =
        inboundItinerary;
    }
  }
  return transformedResult;
};
export default transformResults;
