import moment from 'moment';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

const { FLIGHT_PROVIDERS_COMBINATION } = process.env;
const providerName = 'combigo';

const agent: IDictionary<string> = {
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
    codeShare: {},
    stations: data.stations,
    carriers: data.carriers
  };

  if (
    Object.keys(data).length === 0 ||
    !data ||
    !data.data ||
    !data.data.results ||
    data.data.results.length == 0
  ) {
    transformedResult['error'] = 'No data found';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  const allowed = FLIGHT_PROVIDERS_COMBINATION.split(',').includes('combigo')
    ? true
    : false;

  if (options.tripType === 'oneway') {
    for (const trip of data.data.results) {
      const Segments: TransformedSegment[] = [];
      const Legs: TransformedLeg[] = [];
      const types = [...new Set(trip.map((leg) => leg.type))];

      if (!allowed && (types.includes('BUS') || types.includes('TRAIN')))
        continue;

      for (const outbound_journey of trip.legs) {
        const {
          dTime,
          aTime,
          trIATA,
          trId,
          type,
          fromIATA,
          toIATA,
          trNum,
          fromIdSya,
          toIdSya,
          trName
        } = outbound_journey;

        const origin =
          fromIdSya.split('#')[1] === 'PLANE'
            ? fromIATA
              ? fromIATA
              : fromIdSya
            : fromIdSya;

        const destination =
          toIdSya.split('#')[1] === 'PLANE'
            ? toIATA
              ? toIATA
              : toIdSya
            : toIdSya;
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: origin,
          destination: destination,
          departure: moment.utc(dTime).format('YYYYMMDDHHmm'),
          arrival: moment.utc(aTime).format('YYYYMMDDHHmm'),
          marketingCarrier: trIATA ? trIATA : trName,
          operatingCarrier: trIATA ? trIATA : trName,
          marketingFlightNumber: trNum,
          vehicleType: type === 'PLANE' ? 'FLIGHT' : type
        };

        if (trIATA) {
          transformedResult.codeShare[`${trIATA}${trId}`] = {
            marketingCarrier: trIATA,
            operatingCarrier: trIATA
          };
        }

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
        url: trip.booking.link
      });

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
      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  } else {
    for (const trip of data.data.results) {
      const Legs: TransformedLeg[] = [];
      let Segments: TransformedSegment[] = [];
      const types = [
        ...new Set([...trip.legs, ...trip.legs_rT].map((leg) => leg.type))
      ];

      if (!allowed && (types.includes('BUS') || types.includes('TRAIN')))
        continue;

      for (const outbound_journey of trip.legs) {
        const {
          dTime,
          aTime,
          trIATA,
          trId,
          type,
          fromIATA,
          toIATA,
          trNum,
          fromIdSya,
          toIdSya,
          trName
        } = outbound_journey;

        const origin =
          fromIdSya.split('#')[1] === 'PLANE'
            ? fromIATA
              ? fromIATA
              : fromIdSya
            : fromIdSya;

        const destination =
          toIdSya.split('#')[1] === 'PLANE'
            ? toIATA
              ? toIATA
              : toIdSya
            : toIdSya;
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin,
          destination,
          departure: moment.utc(dTime).format('YYYYMMDDHHmm'),
          arrival: moment.utc(aTime).format('YYYYMMDDHHmm'),
          marketingCarrier: trIATA ? trIATA : trName,
          operatingCarrier: trIATA ? trIATA : trName,
          marketingFlightNumber: trNum,
          vehicleType: type === 'PLANE' ? 'FLIGHT' : type
        };

        if (trIATA) {
          transformedResult.codeShare[`${trIATA}${trId}`] = {
            marketingCarrier: trIATA,
            operatingCarrier: trIATA
          };
        }

        const segment = buildSegment(transFormedSegment);
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
      }

      let Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;

      Segments = [];

      for (const inbound_journey of trip.legs_rT) {
        const {
          dTime,
          aTime,
          trIATA,
          type,
          trNum,
          fromIATA,
          toIATA,
          fromIdSya,
          toIdSya,
          trName
        } = inbound_journey;

        const origin =
          fromIdSya.split('#')[1] === 'PLANE'
            ? fromIATA
              ? fromIATA
              : fromIdSya
            : fromIdSya;

        const destination =
          toIdSya.split('#')[1] === 'PLANE'
            ? toIATA
              ? toIATA
              : toIdSya
            : toIdSya;
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin,
          destination,
          departure: moment.utc(dTime).format('YYYYMMDDHHmm'),
          arrival: moment.utc(aTime).format('YYYYMMDDHHmm'),
          marketingCarrier: trIATA ? trIATA : trName,
          operatingCarrier: trIATA ? trIATA : trName,
          marketingFlightNumber: trNum,
          vehicleType: type === 'PLANE' ? 'FLIGHT' : type
        };

        const segment = buildSegment(transFormedSegment);
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
      }

      Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;

      const itinerary = buildItineraryFromLegs(Legs);
      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: trip.booking.link
      });

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
      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  }
  return transformedResult;
};

export default transformResults;
