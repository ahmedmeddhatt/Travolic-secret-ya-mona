import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs,
  createConvertDateTime
} from '../../../../utils';

const { KISSANDFLY_REFID } = process.env;

const convertDateTime = createConvertDateTime('DD-MM-YYYY HHmm');

const providerName = 'kissandfly';

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
    segments: {},
    codeShare: {}
  };

  if (Object.keys(data).length === 0) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  const redirectUrl = data['RESULTS']['REDIRECT_URL'][0];
  const currency = data['RESULTS']['CURRENCY'][0];
  const Itineraries = data['RESULTS']['ITEMS'][0]['ITEM'];

  if (Itineraries.length === 0) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  for (const itinerary of Itineraries) {
    const price = parseFloat(itinerary['$']['amount']);
    const Hash = itinerary['$']['hash'];
    const trips = itinerary['TRIP_PART'];
    const Legs: TransformedLeg[] = [];

    for (const trip of trips) {
      const Segments: TransformedSegment[] = [];

      for (const seg of trip['SEGMENT']) {
        const departure = seg['DEPARTURE'][0]['$'];

        const departure_date = seg['DEPARTURE'][0]['_'].replace(/\./g, '-');
        const arrival = seg['ARRIVAL'][0]['$'];
        const arrival_date = seg['ARRIVAL'][0]['_'].replace(/\./g, '-');
        const flightDetails = seg['FLIGHT'][0]['$'];
        const flightNumber = seg['FLIGHT'][0]['_'];
        const planeCraft = seg['FLIGHT'][0]['$']['aircraft'];

        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: departure['airport'],
          destination: arrival['airport'],
          departure: convertDateTime(departure_date),
          arrival: convertDateTime(arrival_date),
          marketingCarrier: flightDetails['marketing_supplier'],
          marketingFlightNumber: flightNumber,
          operatingCarrier: flightDetails['operating_supplier'],
          vehicleType: 'FLIGHT',
          aircraft: planeCraft
        };

        const segment = buildSegment(transFormedSegment);

        Segments.push(segment);

        transformedResult.codeShare[
          `${flightDetails['marketing_supplier']}${flightNumber}`
        ] = {
          marketingCarrier: flightDetails['marketing_supplier'],
          operatingCarrier: flightDetails['operating_supplier'],
          aircraftType: planeCraft
        };

        transformedResult.segments[segment.id] = segment;
      }

      const Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
    }

    const Itinerary = buildItineraryFromLegs(Legs);
    const encodedPayload = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url: makeRedirect(redirectUrl, Hash, options.language)
    });

    Itinerary.pricingOptions = [
      {
        agent: agent.id,
        agentName: agent.name,
        deepLink: encodedPayload,
        price: {
          amount: price,
          currency: currency
        }
      }
    ];

    transformedResult.itineraries[Itinerary.id] = Itinerary;
  }

  return transformedResult;
};
const makeRedirect = (redirect: string, hash: string, lang: string): string => {
  return `${redirect}&r_hash=${hash}&refid=${KISSANDFLY_REFID}&subch=web&act=book&language=${lang}`;
};

export default transformResults;
