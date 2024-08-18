import oneWayTrip from './oneWayTrip';
import roundTrip from './roundTrip';
import multiTrip from './multiTrip';

const providerName = 'KIWI';
const agent: IDictionary<string> = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const transformResults = (
  options: SearchOptions,
  data: any
): TransformedResult => {
  let transformedResult: TransformedResult = {
    agents: {},
    legs: {},
    itineraries: {},
    segments: {},
    codeShare: {}
  };

  if (options.tripType === 'multi') {
    if (data.length === 0) {
      transformedResult['error'] = 'No data found.';
      return transformedResult;
    }

    transformedResult.agents[agent.id] = agent;

    return multiTrip(
      data,
      providerName,
      agent,
      options.currency,
      transformedResult
    );
  } else {
    if (!data.data || data.data.length === 0 || Object.keys(data).length < 1) {
      transformedResult['error'] = 'No data found.';
      return transformedResult;
    }

    transformedResult.agents[agent.id] = agent;

    const { currency, data: trips } = data;

    if (options.tripType === 'round') {
      transformedResult = roundTrip(
        trips,
        providerName,
        agent,
        currency,
        transformedResult
      );
    } else if (options.tripType === 'oneway') {
      transformedResult = oneWayTrip(
        trips,
        providerName,
        agent,
        currency,
        transformedResult
      );
    }
  }

  return transformedResult;
};

export default transformResults;
