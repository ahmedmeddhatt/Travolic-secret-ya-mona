import roundTrip from './roundTrip';
import oneWayTrip from './oneWayTrip';

const providerName = 'travix';

const transformResults = (
  options: SearchOptions,
  results: any
): TransformedResult => {
  const transformedResult: TransformedResult = {
    agents: {},
    legs: {},
    itineraries: {},
    segments: {},
    codeShare: {}
  };

  if (options.tripType === 'oneway') {
    return oneWayTrip(results, providerName, transformedResult);
  } else if (options.tripType === 'round') {
    return roundTrip(results, providerName, transformedResult);
  } else if (options.tripType === 'multi') {
    transformedResult['error'] = 'Travix does not support multi-city search';
    return transformedResult;
  }
};

export default transformResults;
