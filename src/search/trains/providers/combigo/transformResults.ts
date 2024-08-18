import moment from 'moment';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

const providerName = 'combigo';

const agent: IDictionary<string> = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const transformResults = async (
  options: SearchTrainOptions,
  transformedData: any
): Promise<TransformedTrainResult> => {
  const { data, stations, carriers, dumpStations, dumpCarriers } =
    transformedData;
  const transformedResult: TransformedTrainResult = {
    agents: {},
    segments: {},
    legs: {},
    outboundItineraries: {},
    inboundItineraries: {},
    stations: stations,
    carriers: carriers
  };

  if (Object.keys(data).length === 0 || data.length == 0) {
    transformedResult['error'] = 'No data found';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  if (options.tripType === 'oneway') {
    for (const trip of data) {
      const Segments: TransformedSegment[] = [];
      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: trip.booking.link
      });
      const types = [...new Set(trip.map((leg) => leg.type))];

      if (types.includes('PLANE')) continue;

      for (const outboundJourney of trip.legs) {
        const {
          dTime,
          aTime,
          trName,
          trNum,
          type,
          fromIdSya,
          toIdSya,
          fromTz,
          toTz
        } = outboundJourney;

        const origin = dumpStations[fromIdSya];
        const destination = dumpStations[toIdSya];
        const carrier = dumpCarriers[trName];

        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: origin,
          destination: destination,
          departure: moment.utc(dTime).format('YYYYMMDDHHmm'),
          arrival: moment.utc(aTime).format('YYYYMMDDHHmm'),
          marketingCarrier: carrier,
          operatingCarrier: carrier,
          marketingFlightNumber: trNum,
          vehicleType: type,
          fromTimezone: fromTz,
          toTimezone: toTz
        };

        const segment = buildSegment(transFormedSegment);

        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
      }

      const Leg = buildLegFromSegments(Segments);

      transformedResult.legs[Leg.id] = Leg;

      const itinerary = buildItineraryFromLegs([Leg]);

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkPayload,
          price: {
            amount: trip.price,
            currency: options.currency
          }
        }
      ];
      transformedResult.outboundItineraries[itinerary.id] = itinerary;
    }
  } else {
    for (const trip of data) {
      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: trip.booking.link
      });

      let Segments: TransformedSegment[] = [];
      const types = [...new Set(trip.map((leg) => leg.type))];

      if (types.includes('PLANE')) continue;

      for (const outbound_journey of trip.legs) {
        const {
          dTime,
          aTime,
          trName,
          trNum,
          type,
          fromIdSya,
          toIdSya,
          fromTz,
          toTz
        } = outbound_journey;

        const origin = dumpStations[fromIdSya];
        const destination = dumpStations[toIdSya];
        const carrier = dumpCarriers[trName];
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: origin,
          destination: destination,
          departure: moment.utc(dTime).format('YYYYMMDDHHmm'),
          arrival: moment.utc(aTime).format('YYYYMMDDHHmm'),
          marketingCarrier: carrier,
          operatingCarrier: carrier,
          marketingFlightNumber: trNum,
          vehicleType: type,
          fromTimezone: fromTz,
          toTimezone: toTz
        };

        const segment = buildSegment(transFormedSegment);
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
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
            amount: trip.price,
            currency: options.currency
          }
        }
      ];

      transformedResult.outboundItineraries[outboundItinerary.id] =
        outboundItinerary;

      Segments = [];

      for (const inbound_journey of trip.legs_rT) {
        const {
          dTime,
          aTime,
          trName,
          trNum,
          type,
          fromIdSya,
          toIdSya,
          fromTz,
          toTz
        } = inbound_journey;

        const origin = dumpStations[fromIdSya];
        const destination = dumpStations[toIdSya];
        const carrier = dumpCarriers[trName];
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: origin,
          destination: destination,
          departure: moment.utc(dTime).format('YYYYMMDDHHmm'),
          arrival: moment.utc(aTime).format('YYYYMMDDHHmm'),
          marketingCarrier: carrier,
          operatingCarrier: carrier,
          marketingFlightNumber: trNum,
          vehicleType: type,
          fromTimezone: fromTz,
          toTimezone: toTz
        };

        const segment = buildSegment(transFormedSegment);
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
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
            amount: trip.price,
            currency: options.currency
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
