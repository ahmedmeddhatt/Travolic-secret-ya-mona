import oneWayTrip from './oneWayTrip';
import roundTrip from './roundTrip';

const providerName = 'scoot';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName,
  isAirline: true
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

  if (Object.keys(data).length === 0) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  data = data['s:Envelope']['s:Body'];

  if (
    data.length == 0 ||
    data[0].GetLowFareTripAvailabilityResponse.length === 0 ||
    data[0].GetLowFareTripAvailabilityResponse[0]
      .LowFareTripAvailabilityResponse.length === 0
  ) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  const trips =
    data[0].GetLowFareTripAvailabilityResponse[0]
      .LowFareTripAvailabilityResponse[0].LowFareAvailabilityResponseList[0]
      .LowFareAvailabilityResponse;

  if (options.tripType == 'oneway') {
    return oneWayTrip(
      transformedResult,
      trips,
      providerName,
      agent,
      generateDeepLink(options)
    );
  } else {
    return roundTrip(
      transformedResult,
      trips,
      providerName,
      agent,
      generateDeepLink(options)
    );
  }
};

const generateDeepLink = (options: SearchOptions): string => {
  if (options.tripType == 'oneway') {
    return `https://makeabooking.flyscoot.com/book/flight/one-way/${options.legs[0].origin}/${options.legs[0].departure}/${options.legs[0].destination}?adult=${options.adults}&amp;child=${options.children}&amp;infant=${options.infants}&amp;orgToken=VEUtiuQY%2FmW09sQ6I0betQ%3D%3D`;
  } else {
    return `https://makeabooking.flyscoot.com/book/flight/return/${options.legs[0].origin}/${options.legs[0].departure}/${options.legs[0].destination}/${options.legs[1].origin}/${options.legs[1].departure}/${options.legs[1].destination}?adult=${options.adults}&amp;child=${options.children}&amp;infant=${options.infants}&amp;orgToken=VEUtiuQY%2FmW09sQ6I0betQ%3D%3D`;
  }
};

export default transformResults;
