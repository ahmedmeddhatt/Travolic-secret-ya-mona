import oneWayTrip from './oneWayTrip';
import roundTrip from './roundTrip';

const providerName = 'travomint';
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

  if (
    data.responsStatus.status === 0 ||
    options.tripType === 'multi' ||
    data.flightResult.length < 1
  ) {
    transformedResult['error'] = 'No data found';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  if (options.tripType === 'oneway') {
    return oneWayTrip(
      providerName,
      agent,
      transformedResult,
      data.flightResult
    );
  } else if (options.tripType === 'round') {
    return roundTrip(providerName, agent, transformedResult, data.flightResult);
  }

  return transformedResult;
};

export default transformResults;
