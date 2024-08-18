import oneWayTrip from './oneWayTrip';
import roundTrip from './roundTrip';
import POS from './pos';

const providerName = 'Akbar';
const agent: IDictionary<string> = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const transformResults = (
  options: SearchOptions,
  results: any
): TransformedResult => {
  const transformedResult: TransformedResult = {
    agents: {},
    legs: {},
    itineraries: {},
    segments: {}
  };

  if (Object.keys(results).length === 0) {
    transformedResult['error'] = 'No results found';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  const posData = POS.find((item) => item.currency === options.currency);

  if (options.tripType == 'oneway') {
    return oneWayTrip(
      transformedResult,
      results,
      posData,
      options,
      providerName,
      agent
    );
  } else if (options.tripType == 'round') {
    return roundTrip(
      transformedResult,
      results,
      posData,
      options,
      providerName,
      agent
    );
  }
};

export default transformResults;
