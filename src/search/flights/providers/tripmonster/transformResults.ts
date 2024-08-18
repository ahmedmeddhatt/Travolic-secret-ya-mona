import oneWayTrip from './oneWayTrip';
import roundTrip from './roundTrip';

const providerName = 'tripmonster';
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
    legs: {},
    itineraries: {},
    segments: {}
  };

  if (!data.flights || !data.flights.itineraries) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  const { payload, flights } = data;
  const trips = flights.itineraries.itinerary;

  if (options.tripType === 'oneway') {
    return oneWayTrip(trips, payload, agent, providerName, transformedResult);
  } else if (options.tripType === 'round') {
    return roundTrip(trips, payload, agent, providerName, transformedResult);
  } else if (options.tripType === 'multi') {
    transformedResult[
      'error'
    ] = `${agent.name} doesn't support trip type: ${options.tripType}`;
    return transformedResult;
  }
};

export default transformResults;
