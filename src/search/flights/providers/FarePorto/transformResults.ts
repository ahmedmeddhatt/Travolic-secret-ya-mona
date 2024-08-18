import moment from 'moment';
import {
  buildItineraryFromLegs,
  buildLegFromSegments,
  encodeRedirectPayload,
  buildSegment
} from '../../../../utils';

const providerName = 'FarePorto';

const agent = {
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
  if (
    Object.keys(data).length === 0 ||
    !data ||
    !data['contracts'] ||
    data['contracts'].length === 0
  ) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }
  transformedResult.agents[agent.id] = agent;
  let Segments: TransformedSegment[] = [];
  let Legs: TransformedLeg[] = [];
  data['contracts'].forEach((flight) => {
    const { totalPrice, redirectUrl } = flight;

    flight['trips'].forEach((Segs) => {
      Segs['flights'].forEach((seg) => {
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: seg['from'],
          destination: seg['to'],
          departure: moment(
            `${seg['departedDate'].split('T')[0]} ${seg['departureTimeStr']}`,
            'YYYY-MM-DD hh:mm A'
          ).format('YYYYMMDDHHmm'),
          arrival: moment(
            `${seg['arrivalAt'].split('T')[0]} ${seg['arrivalTimeStr']}`,
            'YYYY-MM-DD hh:mm A'
          ).format('YYYYMMDDHHmm'),
          marketingCarrier: seg['MarketingAirlineCode'] ?? seg['airline'],
          operatingCarrier: seg['operatingCarrier'] ?? seg['airline'],
          marketingFlightNumber: seg['flightNumber'],
          vehicleType: 'FLIGHT'
        };
        const Segment = buildSegment(transFormedSegment);
        Segments.push(Segment);
        transformedResult.segments[Segment.id] = Segment;

        transformedResult.codeShare[`${seg['airline']}${seg['FlightNumber']}`] =
          {
            marketingCarrier: seg['MarketingAirlineCode'] ?? seg['airline'],
            operatingCarrier: seg['OperatingAirlineCode'] ?? seg['airline'],
            aircraftType: seg['equipmentType']
          };
      });
      const Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
      Segments = [];
    });

    const itinerary = buildItineraryFromLegs(Legs);
    const encodedDeepLink = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url: redirectUrl
    });
    itinerary.pricingOptions = [
      {
        agent: agent.id,
        agentName: agent.name,
        deepLink: encodedDeepLink,
        price: {
          amount: totalPrice,
          currency: 'USD'
        }
      }
    ];
    transformedResult.itineraries[itinerary.id] = itinerary;
    Legs = [];
  });

  return transformedResult;
};

export default transformResults;
