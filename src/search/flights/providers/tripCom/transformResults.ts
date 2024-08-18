import roundTrip from './roundTrip';
import oneWayTrip from './oneWayTrip';

const providerName = 'tripcom';
const agent: IDictionary<string> = {
  id: Buffer.from('Trip.com').toString('base64'),
  name: 'Trip.com'
};

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

  if (!data) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  const {
    ResultCount,
    FltProductInfoList,
    ReturnFltProductInfoList,
    BookingParametersInfo
  } = data;

  if (ResultCount === 0) {
    transformedResult['error'] = 'No data found';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  if (options.tripType === 'round') {
    return roundTrip(
      providerName,
      agent,
      transformedResult,
      ResultCount,
      FltProductInfoList,
      ReturnFltProductInfoList,
      BookingParametersInfo.MetaURL,
      options
    );
  } else if (options.tripType === 'oneway') {
    return oneWayTrip(
      providerName,
      agent,
      transformedResult,
      FltProductInfoList,
      BookingParametersInfo.MetaURL,
      options
    );
  } else if (options.tripType === 'multi') {
    transformedResult['error'] = 'Multi-trip is not supported';
    return transformedResult;
  }
};

export default transformResults;
