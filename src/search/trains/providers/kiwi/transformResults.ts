import moment from 'moment';

import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

const providerName = 'kiwi';

const agent: IDictionary<string> = {
  id: Buffer.from(providerName).toString('base64'),
  name: 'kiwi',
  type: 'train'
};

const typeMapping: IDictionary<string> = {
  train: 'TRAIN',
  bus: 'BUS'
};

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
    stations: stations,
    carriers: carriers
  };

  if (!data.data || data.data.length == 0 || Object.keys(data).length < 1) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  const { currency } = data;
  const trips = data.data;

  for (const trip of trips) {
    const { price, deep_link, route: routes } = trip;
    const deepLinkPayload = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url: deep_link
    });

    if (options.tripType === 'oneway') {
      const Segments: TransformedSegment[] = [];
      for (const route of trip.route) {
        const {
          flyFrom,
          flyTo,
          local_departure,
          local_arrival,
          airline,
          operating_carrier,
          flight_no,
          vehicle_type
        } = route;

        const origin = dumpStations[flyFrom];
        const destination = dumpStations[flyTo];
        const marketingCarrier = dumpCarriers[airline];
        const operatingCarrier =
          dumpCarriers[
            operating_carrier && operating_carrier.length > 0
              ? operating_carrier
              : airline
          ];

        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: origin,
          destination: destination,
          departure: moment
            .utc(local_departure, 'YYYY-MM-DD HH:mm')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(local_arrival, 'YYYY-MM-DD HH:mm')
            .format('YYYYMMDDHHmm'),
          marketingCarrier: marketingCarrier,
          operatingCarrier: operatingCarrier,
          trainNumber: flight_no,
          vehicleType: typeMapping[vehicle_type]
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
            amount: parseFloat(price),
            currency: currency
          }
        }
      ];
      transformedResult.outboundItineraries[itinerary.id] = itinerary;
    } else {
      let Segments: TransformedSegment[] = [];

      const outboundRoutes = routes.filter((route) => route.return === 0);

      for (const route of outboundRoutes) {
        const {
          flyFrom,
          flyTo,
          local_departure,
          local_arrival,
          airline,
          operating_carrier,
          flight_no,
          vehicle_type
        } = route;

        const origin = dumpStations[flyFrom];
        const destination = dumpStations[flyTo];
        const marketingCarrier = dumpCarriers[airline];
        const operatingCarrier =
          dumpCarriers[
            operating_carrier && operating_carrier.length > 0
              ? operating_carrier
              : airline
          ];

        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: origin,
          destination: destination,
          departure: moment
            .utc(local_departure, 'YYYY-MM-DD HH:mm')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(local_arrival, 'YYYY-MM-DD HH:mm')
            .format('YYYYMMDDHHmm'),
          marketingCarrier: marketingCarrier,
          operatingCarrier: operatingCarrier,
          trainNumber: flight_no,
          vehicleType: typeMapping[vehicle_type]
        };

        const segment = buildSegment(transFormedSegment);

        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
      }

      const outboundLeg = buildLegFromSegments(Segments);

      transformedResult.legs[outboundLeg.id] = outboundLeg;

      const outboundItinerary = buildItineraryFromLegs([outboundLeg]);
      const outboundPrice = parseFloat(price);

      outboundItinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkPayload,
          price: {
            amount: outboundPrice,
            currency: currency
          }
        }
      ];
      transformedResult.outboundItineraries[outboundItinerary.id] =
        outboundItinerary;
      Segments = [];

      const inboundRoutes = routes.filter((route) => route.return === 1);
      let counter = 1;

      for (const route of inboundRoutes) {
        const {
          flyFrom,
          flyTo,
          local_departure,
          local_arrival,
          airline,
          flight_no,
          operating_carrier,
          vehicle_type
        } = route;

        const origin = dumpStations[flyFrom];
        const destination = dumpStations[flyTo];
        const marketingCarrier = dumpCarriers[airline];
        const operatingCarrier =
          dumpCarriers[
            operating_carrier && operating_carrier.length > 0
              ? operating_carrier
              : airline
          ];

        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: origin,
          destination: destination,
          departure: moment
            .utc(local_departure, 'YYYY-MM-DD HH:mm')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(local_arrival, 'YYYY-MM-DD HH:mm')
            .format('YYYYMMDDHHmm'),
          marketingCarrier: marketingCarrier,
          operatingCarrier: operatingCarrier,
          trainNumber: flight_no,
          vehicleType: typeMapping[vehicle_type]
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
            amount: outboundPrice,
            currency: currency
          }
        }
      ];

      inboundItinerary.id += `-${counter++}`;

      outboundItinerary.linkedItineraries = [inboundItinerary.id];
      transformedResult.inboundItineraries[inboundItinerary.id] =
        inboundItinerary;
    }
  }
  return transformedResult;
};

export default transformResults;
