import moment from 'moment';
import {
  buildItineraryFromLegs,
  buildLegFromSegments,
  buildSegment,
  encodeRedirectPayload
} from '../../../../utils';
const providerName = 'Milhas123';
const agent: IDictionary<string> = {
  id: Buffer.from(providerName).toString('base64'),
  name: '123Milhas'
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
    transformedResult['error'] = 'no data found';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;
  const currency = data['CURRENCY_ISO4217'];
  const Groups = data['GROUPS'];
  const Flights = Object.values(data['FLIGHTS']);

  if (options.tripType === 'oneway') {
    for (const group of Groups) {
      const Legs: TransformedLeg[] = [];
      const Segments: TransformedSegment[] = [];
      const { OUTBOUND, TOTAL_PRICE } = group;

      const Flight = Flights.find(
        (segment) => segment['UNIQUE_ID'] == OUTBOUND
      );
      const MT = Flight['AIRLINE']['CODE'];
      const Segs = Flight['STOPS'];
      Segs.forEach((seg) => {
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: seg['DEPARTURE_LOCATION'],
          destination: seg['ARRIVAL_LOCATION'],
          departure: moment
            .utc(seg['DEPARTURE_TIME'], 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),

          arrival: moment
            .utc(seg['ARRIVAL_TIME'], 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),
          operatingCarrier: seg['OP'] ? seg['FLIGHT_NUMBER'].slice(0, 2) : '',
          marketingCarrier: MT,
          marketingFlightNumber: seg['FLIGHT_NUMBER'].includes('-')
            ? seg['FLIGHT_NUMBER'].split('-')[1].trim()
            : seg['FLIGHT_NUMBER'].slice(2).trim(),
          vehicleType: 'FLIGHT'
        };

        const segment = buildSegment(transFormedSegment);
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
      });
      const Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;

      const itinerary = buildItineraryFromLegs(Legs);
      const encodedDeepLink = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: `https://123milhas.com/v2/busca?de=${
          options.legs[0].origin
        }&para=${options.legs[0].destination}&ida=${moment
          .utc(options.legs[0].departure, 'YYYY-MM-DD')
          .format('DD-MM-YYYY')}&adultos=${
          options.adults
        }&outbound_id=${OUTBOUND}&criancas=${options.children}&babies=${
          options.infants
        }`
      });

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: encodedDeepLink,
          price: {
            amount: TOTAL_PRICE,
            currency: currency
          }
        }
      ];
      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  } else {
    for (const group of Groups) {
      const Legs: TransformedLeg[] = [];
      let Segments: TransformedSegment[] = [];
      const { OUTBOUND, INBOUND, TOTAL_PRICE } = group;

      const Flight = Flights.find(
        (segment) => segment['UNIQUE_ID'] == OUTBOUND
      );
      const MT = Flight['AIRLINE']['CODE'];
      const Segs = Flight['STOPS'];
      Segs.forEach((seg) => {
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: seg['DEPARTURE_LOCATION'],
          destination: seg['ARRIVAL_LOCATION'],
          departure: moment
            .utc(seg['DEPARTURE_TIME'], 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),

          arrival: moment
            .utc(seg['ARRIVAL_TIME'], 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),
          operatingCarrier: seg['FLIGHT_NUMBER'].slice(0, 2),
          marketingCarrier: MT,
          marketingFlightNumber: seg['FLIGHT_NUMBER'].includes('-')
            ? seg['FLIGHT_NUMBER'].split('-')[1].trim()
            : seg['FLIGHT_NUMBER'].slice(2).trim(),
          vehicleType: 'FLIGHT'
        };
        const segment = buildSegment(transFormedSegment);
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
      });
      let Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
      Segments = [];

      const returnFlight = Flights.find(
        (segment) => segment['UNIQUE_ID'] == INBOUND
      );
      const MT2 = returnFlight['AIRLINE']['CODE'];

      const returnSegs = returnFlight['STOPS'];
      returnSegs.forEach((seg) => {
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: seg['DEPARTURE_LOCATION'],
          destination: seg['ARRIVAL_LOCATION'],
          departure: moment
            .utc(seg['DEPARTURE_TIME'], 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),

          arrival: moment
            .utc(seg['ARRIVAL_TIME'], 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),
          operatingCarrier: seg['FLIGHT_NUMBER'].slice(0, 2),
          marketingCarrier: MT2,
          marketingFlightNumber: seg['FLIGHT_NUMBER'].includes('-')
            ? seg['FLIGHT_NUMBER'].split('-')[1].trim()
            : seg['FLIGHT_NUMBER'].slice(2).trim(),
          vehicleType: 'FLIGHT'
        };
        const segment = buildSegment(transFormedSegment);
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
      });
      Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
      Segments = [];

      const itinerary = buildItineraryFromLegs(Legs);
      const encodedDeepLink = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: `https://123milhas.com/v2/busca?de=${
          options.legs[0].origin
        }&para=${options.legs[0].destination}&ida=${moment
          .utc(options.legs[0].departure, 'YYYY-MM-DD')
          .format('DD-MM-YYYY')}&volta=${moment
          .utc(options.legs[1].departure, 'YYYY-MM-DD')
          .format('DD-MM-YYYY')}&adultos=${
          options.adults
        }&outbound_id=${OUTBOUND}&inbound_id=${INBOUND}&criancas=${
          options.children
        }&babies=${options.infants}`
      });

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: encodedDeepLink,
          price: {
            amount: TOTAL_PRICE,
            currency: currency
          }
        }
      ];
      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  }

  return transformedResult;
};

export default transformResults;
