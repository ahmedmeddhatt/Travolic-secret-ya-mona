import moment from 'moment';
import {
  buildItineraryFromLegs,
  buildLegFromSegments,
  buildSegment,
  encodeRedirectPayload
} from '../../../../utils';

const providerName = 'kombo';
const agent: IDictionary<string> = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName,
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

  if (!data || Object.values(data).length === 0) {
    transformedResult['error'] = 'No data found.';
  }

  transformedResult.agents[agent.id] = agent;

  if (options.tripType == 'oneway') {
    let Segments: TransformedSegment[] = [];
    const results = data['trips'];

    for (const result of results) {
      const { price } = result;
      const deeplink = `www.kombo.co/affilate/${2452}/${options.language}/${
        options.adults + options.children + options.infants
      }/${result.tripId}`;
      const companyData = data['dependencies']['companies'];
      const route = result.segments[0][0];
      const {
        departureStationId,
        arrivalStationId,
        departureTime,
        arrivalTime,
        companyId,
        transportNumber
      } = route;
      const vehicleType = `${
        companyData[companyId.toString()]['transportType']
      }`;
      const transFormedSegment: TransformedSegmentWithoutID = {
        origin: dumpStations[departureStationId],
        destination: dumpStations[arrivalStationId],
        departure: moment
          .utc(departureTime, 'YYYY-MM-DDTHH:mm')
          .format('YYYYMMDDHHmm'),
        arrival: moment
          .utc(arrivalTime, 'YYYY-MM-DDTHH:mm')
          .format('YYYYMMDDHHmm'),
        marketingCarrier: dumpCarriers[companyId],
        operatingCarrier: dumpCarriers[companyId],
        trainNumber: transportNumber,
        vehicleType: typeMapping[vehicleType]
      };
      const segment = buildSegment(transFormedSegment);

      Segments.push(segment);
      transformedResult.segments[segment.id] = segment;

      const Leg = buildLegFromSegments(Segments);

      transformedResult.legs[Leg.id] = Leg;

      const itinerary = buildItineraryFromLegs([Leg]);

      Segments = [];

      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: deeplink
      });

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkPayload,
          price: {
            amount: price / 100,
            currency: 'EUR'
          }
        }
      ];
      transformedResult.outboundItineraries[itinerary.id] = itinerary;
    }
  } else {
    let Segments: TransformedSegment[] = [];
    const inBoundResults = data['inBoundData']['trips'];

    for (const result of inBoundResults) {
      const { price } = result;
      const deeplink = `www.kombo.co/affilate/2452/${options.language}/${
        options.adults + options.children + options.infants
      }/${result.tripId}`;
      const companyData = data['inBoundData']['dependencies']['companies'];
      const route = result.segments[0][0];
      const {
        departureStationId,
        arrivalStationId,
        departureTime,
        arrivalTime,
        companyId,
        transportNumber
      } = route;

      const vehicleType = `${
        companyData[companyId.toString()]['transportType']
      }`;

      const transFormedSegment: TransformedSegmentWithoutID = {
        origin: dumpStations[departureStationId],
        destination: dumpStations[arrivalStationId],
        departure: moment
          .utc(departureTime, 'YYYY-MM-DDTHH:mm')
          .format('YYYYMMDDHHmm'),
        arrival: moment
          .utc(arrivalTime, 'YYYY-MM-DDTHH:mm')
          .format('YYYYMMDDHHmm'),
        marketingCarrier: dumpCarriers[companyId],
        operatingCarrier: dumpCarriers[companyId],
        trainNumber: transportNumber,
        vehicleType: typeMapping[vehicleType]
      };
      const segment = buildSegment(transFormedSegment);

      Segments.push(segment);
      transformedResult.segments[segment.id] = segment;

      const inboundLeg = buildLegFromSegments(Segments);

      transformedResult.legs[inboundLeg.id] = inboundLeg;

      const inboundItinerary = buildItineraryFromLegs([inboundLeg]);

      transformedResult.inboundItineraries[inboundItinerary.id] =
        inboundItinerary;
      Segments = [];

      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: deeplink
      });

      inboundItinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkPayload,
          price: {
            amount: price / 100,
            currency: 'EUR'
          }
        }
      ];
    }

    const inboundItinerariesArray = Object.values(
      transformedResult.inboundItineraries
    );
    const outBoundResults = data['outBoundData']['trips'];

    for (const result of outBoundResults) {
      const { price } = result;
      const deeplink = `www.kombo.co/affilate/${2452}/${options.language}/${
        options.adults + options.children + options.infants
      }/${result.tripId}`;
      const companyData = data['outBoundData']['dependencies']['companies'];
      const route = result.segments[0][0];
      const {
        departureStationId,
        arrivalStationId,
        departureTime,
        arrivalTime,
        companyId,
        transportNumber
      } = route;
      const vehicleType = `${
        companyData[companyId.toString()]['transportType']
      }`;
      const transFormedSegment: TransformedSegmentWithoutID = {
        origin: dumpStations[departureStationId],
        destination: dumpStations[arrivalStationId],
        departure: moment
          .utc(departureTime, 'YYYY-MM-DDTHH:mm')
          .format('YYYYMMDDHHmm'),
        arrival: moment
          .utc(arrivalTime, 'YYYY-MM-DDTHH:mm')
          .format('YYYYMMDDHHmm'),
        marketingCarrier: dumpCarriers[companyId],
        operatingCarrier: dumpCarriers[companyId],
        trainNumber: transportNumber, //err here
        vehicleType: typeMapping[vehicleType]
      };
      const segment = buildSegment(transFormedSegment);

      Segments.push(segment);
      transformedResult.segments[segment.id] = segment;

      const outboundLeg = buildLegFromSegments(Segments);

      transformedResult.legs[outboundLeg.id] = outboundLeg;

      const outboundItinerary = buildItineraryFromLegs([outboundLeg]);

      Segments = [];

      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: deeplink
      });
      const linkedItineraries = [];
      const minPrice = Math.min(
        ...inboundItinerariesArray.map((item) => {
          linkedItineraries.push(item.id);
          transformedResult.inboundItineraries[
            item.id
          ].pricingOptions[0].price.amount += price;
          return item.pricingOptions[0].price.amount;
        })
      );

      outboundItinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkPayload,
          price: {
            from: price,
            amount: minPrice,
            currency: 'EUR'
          }
        }
      ];
      outboundItinerary.linkedItineraries = linkedItineraries;
      transformedResult.outboundItineraries[outboundItinerary.id] =
        outboundItinerary;
    }
  }

  return transformedResult;
};

export default transformResults;
