import oneWayTrip from './oneWayTrip';
import roundTrip from './roundTrip';

const providerName = 'tix';

const transformResults = (
  options: SearchOptions,
  data: any
): TransformedResult => {
  const transformedResult: TransformedResult = {
    agents: {},
    legs: {},
    itineraries: {},
    segments: {},
    codeShare: {}
  };

  if (data.length === 0) {
    transformedResult['error'] = 'No flights found.';
    return transformedResult;
  }

  if (options.tripType === 'oneway') {
    return oneWayTrip(transformedResult, providerName, data);
  } else if (options.tripType === 'round') {
    return roundTrip(transformedResult, providerName, data);
  } else {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }
};

export default transformResults;
