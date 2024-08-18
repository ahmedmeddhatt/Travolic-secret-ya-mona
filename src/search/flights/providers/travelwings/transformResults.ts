import oneWayTrip from './oneWayTrip';
import roundTrip from './roundTrip';
import multiTrip from './multiTrip';

const providerName = 'Travelwings';

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
    itineraries: {},
    segments: {},
    legs: {},
    codeShare: {}
  };

  if (
    Object.keys(data).length === 0 ||
    !data.flightResponse ||
    !data.flightResponse.flightItinerary ||
    data.flightResponse.flightItinerary.length === 0
  ) {
    transformedResult.error = 'No data found.';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  if (options.tripType === 'oneway') {
    return oneWayTrip(
      providerName,
      agent,
      data.flightResponse.flightItinerary,
      transformedResult
    );
  } else if (options.tripType === 'round') {
    return roundTrip(
      providerName,
      agent,
      data.flightResponse.flightItinerary,
      transformedResult
    );
  } else if (options.tripType === 'multi') {
    return multiTrip(
      providerName,
      agent,
      data.flightResponse.flightItinerary,
      options.legs.length,
      transformedResult
    );
  }
};

export default transformResults;
