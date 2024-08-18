import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';
import moment from 'moment';

const providerName = 'skytours';
const agent: IDictionary<string> = {
  id: Buffer.from('Sky Tours').toString('base64'),
  name: 'Sky Tours'
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

  if (
    Object.keys(data).length === 0 ||
    typeof data.xml.alt_inf === 'undefined' ||
    data.xml.alt_inf.length === 0
  ) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  const flightsType = [];

  if (options.tripType == 'oneway') {
    flightsType.push('outbound');
  } else if (options.tripType == 'round') {
    flightsType.push('outbound', 'inbound');
  } else {
    for (let index = 1; index <= options.legs.length; index++) {
      flightsType.push(`flight${index}`);
    }
  }

  for (const trip of data.xml.alt_inf) {
    const Legs: TransformedLeg[] = [];
    const totalPieces = [];

    for (const flightType of flightsType) {
      const Segments: TransformedSegment[] = [];

      for (const flight of trip[flightType][0].fli_inf) {
        const {
          departure_airport,
          arrival_airport,
          departure_date,
          departure_time,
          arrival_date,
          arrival_time,
          airline_code,
          flight_num,
          baggage_included
        } = flight;
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: departure_airport[0],
          destination: arrival_airport[0],
          departure: moment
            .utc(
              `${departure_date[0]} ${departure_time[0]}`,
              'YYYY-MM-DD HH:mm'
            )
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(`${arrival_date[0]} ${arrival_time[0]}`, 'YYYY-MM-DD HH:mm')
            .format('YYYYMMDDHHmm'),
          marketingCarrier: airline_code[0],
          operatingCarrier: airline_code[0],
          marketingFlightNumber: flight_num[0],
          vehicleType: 'FLIGHT'
        };

        const segment = buildSegment(transFormedSegment);

        if (baggage_included[0] !== 'No luggage included') {
          totalPieces.push(Number(baggage_included[0].split('')[0]));
        }

        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
        transformedResult.codeShare[`${airline_code[0]}${flight_num[0]}`] = {
          marketingCarrier: airline_code[0],
          operatingCarrier: airline_code[0]
        };
      }

      const Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
    }

    const itinerary = buildItineraryFromLegs(Legs);
    const deepLinkPayload = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url: `${trip.offerlink[0]}&lang=${
        options.language == 'ar' ? 'sa' : options.language
      }`
    });

    itinerary.pricingOptions = [
      {
        agent: agent.id,
        agentName: agent.name,
        deepLink: deepLinkPayload,
        price: {
          amount: parseFloat(trip.total_price[0]),
          currency: trip.currency[0]
        },
        meta: {
          restrictions: {
            refundable:
              trip['outbound'][0]['fli_inf'][0]['fare_conditions'].join(' ') ==
              "Not refundable, ticket can't be modified"
                ? false
                : true
          },
          baggage: {
            totalPieces:
              totalPieces.length > 0 ? Math.max(...totalPieces) : undefined
          }
        }
      }
    ];

    transformedResult.itineraries[itinerary.id] = itinerary;
  }

  return transformedResult;
};

export default transformResults;
