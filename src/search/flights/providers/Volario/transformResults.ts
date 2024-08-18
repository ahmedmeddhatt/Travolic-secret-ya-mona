import moment from 'moment';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';
const providerName = 'Volario';

const agent: IDictionary<string> = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const supportedCurrency = ['USD', 'EUR', 'GBP'];

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

  if (
    Object.keys(data).length === 0 ||
    !data ||
    !data['search_results'] ||
    data['search_results'].length === 0
  ) {
    transformedResult['error'] = 'no data found';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  for (const res of data.search_results) {
    const Legs: TransformedLeg[] = [];
    let Segments: TransformedSegment[] = [];
    const BaggagesInKilos = [];
    const totalBaggages = [];

    for (const leg of res.legs) {
      for (const seg of leg.segments) {
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: seg['origin_airport_iata'],
          destination: seg['destination_airport_iata'],
          departure: moment
            .utc(seg['departure_time_iso'], 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(seg['arrival_time_iso'], 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),
          marketingCarrier: seg['marketing_airline_iata'],
          operatingCarrier: seg['operating_airline_iata'],
          marketingFlightNumber: seg['flight_number'],
          vehicleType: 'FLIGHT'
        };

        const segment = buildSegment(transFormedSegment);
        Segments.push(segment);

        BaggagesInKilos.push(
          !seg.baggage_weight_allowance
            ? 0
            : Number(seg.baggage_weight_allowance)
        );
        totalBaggages.push(
          !seg.baggage_allowance ? 0 : Number(seg.baggage_allowance)
        );

        transformedResult.segments[segment.id] = segment;
        transformedResult.codeShare[
          `${seg.marketing_airline_iata}${seg.flight_number}`
        ] = {
          marketingCarrier: seg.marketing_airline_iata,
          operatingCarrier: seg.operating_airline_iata
        };
      }

      const Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;

      Segments = [];
    }

    const itinerary = buildItineraryFromLegs(Legs);
    const encodedDeepLink = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url:
        res.url +
        `&currency=${
          supportedCurrency.includes(options.currency)
            ? options.currency
            : 'USD'
        }`
    });

    itinerary.pricingOptions = [
      {
        agent: agent.id,
        agentName: agent.name,
        deepLink: encodedDeepLink,
        price: {
          amount: res.price.total_price,
          currency: res.price.currency
        },
        meta: {
          baggage: {
            BaggagesInKilos:
              BaggagesInKilos.length > 0
                ? Math.max(...BaggagesInKilos)
                : undefined,
            totalBaggages:
              totalBaggages.length > 0 ? Math.max(...totalBaggages) : undefined
          }
        }
      }
    ];

    transformedResult.itineraries[itinerary.id] = itinerary;
  }

  return transformedResult;
};

export default transformResults;
