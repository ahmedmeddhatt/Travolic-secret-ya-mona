import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';
import moment from 'moment';

const providerName = 'kiwi';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};
function transformResults(options: SearchOptions, data) {
  const transformedResult = {
    agents: {},
    legs: {},
    itineraries: {},
    segments: {},
    DataTransfer: data
  };

  if (data.length < 1) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  const { currency, data: trips } = data;

  trips.forEach((trip) => {
    const { price, deep_link: redirectUrl } = trip;
    const Legs: TransformedLeg[] = [];

    trip['route'].forEach((flights) => {
      const Segments = [];
      flights['route'].forEach((flight) => {
        const segment = buildSegment({
          origin: flight['flyFrom'], //segment departure airport code
          destination: flight['flyTo'], //segment arrival airport code
          departure: moment
            .utc(flight['local_departure'], 'YYYY-MM-DD HH:mm')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(flight['local_arrival'], 'YYYY-MM-DD HH:mm')
            .format('YYYYMMDDHHmm'),
          marketingCarrier: flight['operating_carrier'],
          operatingCarrier: flight['operating_carrier'],
          marketingFlightNumber: flight['flight_no']
        });
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
      });

      const Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
    });

    // create Itinerary
    const itinerary = buildItineraryFromLegs(Legs);
    const deepLinkPayload = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url: redirectUrl
    });

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
    transformedResult.itineraries[itinerary.id] = itinerary;
  });

  return transformedResult;
}
export default transformResults;
