import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs,
  createConvertDateTime
} from '../../../../utils';

const { MYTICKETS_REFID } = process.env;
const providerName = 'mytickets';
const convertDateTime = createConvertDateTime('DD-MM-YYYY HHmm');
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

  const redirectUrl = data['RESULTS']['REDIRECT_URL'][0];
  const currency = data['RESULTS']['CURRENCY'][0];
  const Itineraries = data['RESULTS']['ITEMS'][0]['ITEM'];

  if (Itineraries.length === 0) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  for (const itinerary of Itineraries) {
    const price = parseFloat(itinerary['$']['amount']);
    const Hash = itinerary['$']['hash'];
    const trips = itinerary['TRIP_PART'];
    const Legs: TransformedLeg[] = [];
    const flightBaggagesPieces = [];
    const flightBaggagesWeight = [];

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
        const flightBaggage = flightDetails['baggage'];

        if (flightBaggage !== '') {
          const flightBaggageSplitingArr = flightBaggage.split('PC');

          if (flightBaggageSplitingArr.length >= 2) {
            flightBaggagesPieces.push(Number(flightBaggageSplitingArr[0]));
            flightBaggagesWeight.push(Number(flightBaggageSplitingArr[1]));
          } else if (flightBaggageSplitingArr.length === 1) {
            flightBaggagesPieces.push(Number(flightBaggageSplitingArr[0]));
          }
        }

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

    const priceOption = {
      agent: agent.id,
      agentName: agent.name,
      deepLink: encodedPayload,
      price: {
        amount: price,
        currency: currency
      }
    };

    if (
      flightBaggagesPieces.length !== 0 ||
      flightBaggagesWeight.length !== 0
    ) {
      let totalBaggages, BaggagesInKilos;
      if (
        flightBaggagesPieces.length &&
        Math.max(...flightBaggagesPieces) !== 0
      ) {
        totalBaggages = Math.max(...flightBaggagesPieces);
      } else {
        totalBaggages = undefined;
      }

      if (
        flightBaggagesWeight.length &&
        Math.max(...flightBaggagesWeight) !== 0
      ) {
        BaggagesInKilos = Math.max(...flightBaggagesWeight);
      } else {
        BaggagesInKilos = undefined;
      }

      if (totalBaggages || BaggagesInKilos) {
        priceOption['meta'] = {
          baggage: {
            totalBaggages,
            BaggagesInKilos
          }
        };
      }
    }

    Itinerary.pricingOptions = [priceOption];

    transformedResult.itineraries[Itinerary.id] = Itinerary;
  }

  return transformedResult;
};

const makeRedirect = (redirect, hash, lang) => {
  return `${redirect}&r_hash=${hash}&refid=${MYTICKETS_REFID}&subch=web&act=book&language=${lang}`;
};

export default transformResults;
