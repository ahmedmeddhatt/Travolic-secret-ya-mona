import moment from 'moment';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

const providerName = 'Farehutz';
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
    itineraries: {}
  };
  transformedResult.agents[agent.id] = agent;
  if (
    Object.keys(data).length === 0 ||
    !data['variants'] ||
    !data['variants']['variant']
  ) {
    transformedResult['error'] = 'No results found';
    return transformedResult;
  }

  if (options.tripType === 'oneway') {
    for (const trip of data['variants']['variant']) {
      const Segments: TransformedSegment[] = [];
      const Legs: TransformedLeg[] = [];
      for (const seg of trip['segment'][0]['flight']) {
        const {
          arrival,
          arrivalDate,
          arrivalTime,
          departure,
          departureDate,
          departureTime,
          marketingCarrier,
          operatingCarrier,
          number
        } = seg;
        const depdateTime = `${departureDate[0]}${departureTime[0]}`;
        const arrdateTime = `${arrivalDate[0]}${arrivalTime[0]}`;
        const transformedSegment: TransformedSegmentWithoutID = {
          origin: departure[0],
          destination: arrival[0],
          marketingCarrier: marketingCarrier[0],
          operatingCarrier: operatingCarrier
            ? operatingCarrier[0]
            : marketingCarrier[0],
          departure: moment
            .utc(depdateTime, 'YYYY-MM-DDHH:mm')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(arrdateTime, 'YYYY-MM-DDHH:mm')
            .format('YYYYMMDDHHmm'),
          marketingFlightNumber: number[0],
          vehicleType: 'FLIGHT'
        };
        const segment = buildSegment(transformedSegment);
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
      }
      const leg = buildLegFromSegments(Segments);
      Legs.push(leg);
      transformedResult.legs[leg.id] = leg;

      const itinerary = buildItineraryFromLegs(Legs);

      const deepLinkpayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: trip['url'][0]
      });

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkpayload,
          price: {
            amount: trip['price'],
            currency: trip['currency']
          }
        }
      ];
      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  } else {
    for (const trip of data['variants']['variant']) {
      let Segments: TransformedSegment[] = [];
      const Legs: TransformedLeg[] = [];

      for (const seg of trip['segment'][0]['flight']) {
        const {
          arrival,
          arrivalDate,
          arrivalTime,
          departure,
          departureDate,
          departureTime,
          marketingCarrier,
          number,
          operatingCarrier
        } = seg;
        const depdateTime = `${departureDate[0]}${departureTime[0]}`;
        const arrdateTime = `${arrivalDate[0]}${arrivalTime[0]}`;
        const transformedSegment: TransformedSegmentWithoutID = {
          origin: departure[0],
          destination: arrival[0],
          marketingCarrier: marketingCarrier[0],
          operatingCarrier: operatingCarrier
            ? operatingCarrier[0]
            : marketingCarrier[0],
          departure: moment
            .utc(depdateTime, 'YYYY-MM-DDHH:mm')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(arrdateTime, 'YYYY-MM-DDHH:mm')
            .format('YYYYMMDDHHmm'),
          marketingFlightNumber: number[0],
          vehicleType: 'FLIGHT'
        };
        const segment = buildSegment(transformedSegment);
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
      }
      let leg = buildLegFromSegments(Segments);
      Legs.push(leg);
      transformedResult.legs[leg.id] = leg;
      Segments = [];

      for (const seg of trip['segment'][1]['flight']) {
        const {
          arrival,
          arrivalDate,
          arrivalTime,
          departure,
          departureDate,
          departureTime,
          marketingCarrier,
          number,
          operatingCarrier
        } = seg;
        const depdateTime = `${departureDate[0]}${departureTime[0]}`;
        const arrdateTime = `${arrivalDate[0]}${arrivalTime[0]}`;
        const transformedSegment: TransformedSegmentWithoutID = {
          origin: departure[0],
          destination: arrival[0],
          marketingCarrier: marketingCarrier[0],
          operatingCarrier: operatingCarrier
            ? operatingCarrier[0]
            : marketingCarrier[0],
          departure: moment
            .utc(depdateTime, 'YYYY-MM-DDHH:mm')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(arrdateTime, 'YYYY-MM-DDHH:mm')
            .format('YYYYMMDDHHmm'),
          marketingFlightNumber: number[0],
          vehicleType: 'FLIGHT'
        };
        const segment = buildSegment(transformedSegment);
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
      }
      leg = buildLegFromSegments(Segments);
      Legs.push(leg);
      transformedResult.legs[leg.id] = leg;
      const itinerary = buildItineraryFromLegs(Legs);
      const deepLinkpayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: trip['url'][0]
      });

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkpayload,
          price: {
            amount: trip['price'],
            currency: trip['currency']
          }
        }
      ];
      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  }
  return transformedResult;
};

export default transformResults;
