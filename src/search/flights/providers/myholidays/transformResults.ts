import moment from 'moment';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

const providerName = 'MyHolidays';

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

  for (const flight of data.flight) {
    const price = flight.price[0];
    const currency = flight.currency[0];
    const deepLink = flight.url[0];
    const segments = flight.segment;
    const Legs: TransformedLeg[] = [];

    for (const segmentData of segments) {
      const Segments: TransformedSegment[] = [];
      for (const leg of segmentData.leg) {
        const {
          origin,
          destination,
          departureDate,
          arrivalDate,
          departureTime,
          arrivalTime,
          marketingAirlineCode,
          operatingAirlineCode,
          flightNumber,
          equipment
        } = leg;

        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: origin[0],
          destination: destination[0],
          departure: moment
            .utc(
              `${departureDate[0]} ${departureTime[0]}`,
              'YYYY-MM-DD HH:mm:ss'
            )
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(`${arrivalDate[0]} ${arrivalTime[0]}`, 'YYYY-MM-DD HH:mm:ss')
            .format('YYYYMMDDHHmm'),
          marketingCarrier: marketingAirlineCode[0],
          marketingFlightNumber: flightNumber[0],
          operatingCarrier: operatingAirlineCode[0],
          vehicleType: 'FLIGHT',
          aircraft: equipment[0]
        };

        const segment = buildSegment(transFormedSegment);

        Segments.push(segment);
        transformedResult.codeShare[
          `${marketingAirlineCode[0]}${flightNumber[0]}`
        ] = {
          marketingCarrier: marketingAirlineCode[0],
          operatingCarrier: operatingAirlineCode[0],
          aircraftType: equipment[0]
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
      url: deepLink
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

export default transformResults;
