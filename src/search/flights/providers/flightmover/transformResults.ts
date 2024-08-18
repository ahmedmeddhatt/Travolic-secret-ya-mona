import moment from 'moment';
import {
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs,
  encodeRedirectPayload
} from '../../../../utils';

const providerName = 'flightmover';
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
    legs: {},
    itineraries: {},
    segments: {}
  };

  if (options.tripType === 'multi') {
    transformedResult['error'] = 'no data found';
    return transformedResult;
  }

  if (
    !data ||
    Object.keys(data).length === 0 ||
    data['GetItineraries'].length === 0
  ) {
    transformedResult['error'] = 'no data found';
    return transformedResult;
  }
  transformedResult.agents[agent.id] = agent;
  const results = data['GetItineraries'];
  if (options.tripType === 'oneway') {
    for (const trip of results) {
      const Legs: TransformedLeg[] = [];
      const Segments: TransformedSegment[] = [];
      const deeplink = trip['Url'];
      const segmentResults = trip['OutBound']['Sector'];
      segmentResults.forEach((item) => {
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: item['DepAirportCode'],
          destination: item['ArrAirportCode'],
          departure: moment
            .utc(item['DepDateTime'], 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(item['ArrDateTime'], 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),
          marketingCarrier: item['MCarrier'],
          operatingCarrier: item['OCarrier'],
          marketingFlightNumber: item['4321'],
          vehicleType: 'FLIGHT',
          aircraft: item['Equipment']
        };
        const segment = buildSegment(transFormedSegment);
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
      });
      const Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;

      const itinerary = buildItineraryFromLegs(Legs);
      const encodedDeepLink = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: deeplink
      });

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: encodedDeepLink,
          price: {
            amount: trip['TotalPrice'],
            currency: 'USD'
          }
        }
      ];

      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  } else {
    for (const trip of results) {
      const Legs: TransformedLeg[] = [];
      let Segments: TransformedSegment[] = [];
      const deeplink = trip['Url'];

      const segmentResults = trip['OutBound']['Sector'];
      const segmentResultsR = trip['InBound']['Sector'];
      segmentResults.forEach((item) => {
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: item['DepAirportCode'],
          destination: item['ArrAirportCode'],
          departure: moment
            .utc(item['DepDateTime'], 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(item['ArrDateTime'], 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),
          marketingCarrier: item['MCarrier'],
          operatingCarrier: item['OCarrier'],
          marketingFlightNumber: item['4321'],
          vehicleType: 'FLIGHT'
        };
        const segment = buildSegment(transFormedSegment);
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
      });
      let Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
      Segments = [];

      segmentResultsR.forEach((item) => {
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: item['DepAirportCode'],
          destination: item['ArrAirportCode'],
          departure: moment
            .utc(item['DepDateTime'], 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(item['ArrDateTime'], 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),
          marketingCarrier: item['MCarrier'],
          operatingCarrier: item['OCarrier'],
          marketingFlightNumber: item['4321'],
          vehicleType: 'FLIGHT',
          aircraft: item['Equipment']
        };
        const segment = buildSegment(transFormedSegment);
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
      });
      Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
      Segments = [];

      const itinerary = buildItineraryFromLegs(Legs);
      const encodedDeepLink = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: deeplink
      });

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: encodedDeepLink,
          price: {
            amount: trip['TotalPrice'],
            currency: 'USD'
          }
        }
      ];

      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  }

  return transformedResult;
};

export default transformResults;
