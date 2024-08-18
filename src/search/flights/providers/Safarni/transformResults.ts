import moment from 'moment';
const providerName = 'Safarni';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

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
    segments: {}
  };

  if (data.length == 0 || !data || Object.keys(data).length == 0) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;
  const results = Object.values(data['flightItineraries']);

  if (options.tripType === 'oneway') {
    for (const result of results) {
      const Legs: TransformedLeg[] = [];
      let Segments: TransformedSegment[] = [];

      const deepLink = result['deeplinkUrl'];
      const price = result['price']['totalAmount'];
      const currency = result['price']['currencyCode'];
      const refun = result['price']['isRefundable'];

      const resLegs = result['legs']['leg1']['segments'];
      for (const seg of resLegs) {
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: seg.departureAirportCode,
          destination: seg.arrivalAirportCode,
          departure: moment
            .utc(seg.departureDateTime, 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),

          arrival: moment
            .utc(seg.arrivalDateTime, 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),
          marketingCarrier: seg.airlineCode,
          marketingFlightNumber: seg.flightNumber,
          vehicleType: 'FLIGHT'
        };
        const segment = buildSegment(transFormedSegment);
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
      }

      const Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;

      Segments = [];

      const itinerary = buildItineraryFromLegs(Legs);
      const encodedDeepLink = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: deepLink
      });
      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: encodedDeepLink,
          price: {
            amount: price,
            currency: currency
          },
          meta: {
            restrictions: {
              refundable: refun === true ? true : false
            }
          }
        }
      ];

      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  } else if (options.tripType === 'round') {
    for (const result of results) {
      const Legs: TransformedLeg[] = [];
      let Segments: TransformedSegment[] = [];

      const deepLink = result['deeplinkUrl'];
      const price = result['price']['totalAmount'];
      const currency = result['price']['currencyCode'];
      const refun = result['price']['isRefundable'];

      const resLegs = result['legs']['leg1']['segments'];
      const reslegs2 = result['legs']['leg2']['segments'];
      for (const seg of resLegs) {
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: seg.departureAirportCode,
          destination: seg.arrivalAirportCode,
          departure: moment
            .utc(seg.departureDateTime, 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),

          arrival: moment
            .utc(seg.arrivalDateTime, 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),
          marketingCarrier: seg.airlineCode,
          marketingFlightNumber: seg.flightNumber
        };
        const segment = buildSegment(transFormedSegment);
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
      }
      let Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;

      Segments = [];

      for (const seg of reslegs2) {
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: seg.departureAirportCode,
          destination: seg.arrivalAirportCode,
          departure: moment
            .utc(seg.departureDateTime, 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),

          arrival: moment
            .utc(seg.arrivalDateTime, 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),
          marketingCarrier: seg.airlineCode,
          marketingFlightNumber: seg.flightNumber
        };
        const segment = buildSegment(transFormedSegment);
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
      }
      Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;

      Segments = [];

      const itinerary = buildItineraryFromLegs(Legs);
      const encodedDeepLink = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: deepLink
      });
      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: encodedDeepLink,
          price: {
            amount: price,
            currency: currency
          },
          meta: {
            restrictions: {
              refundable: refun === true ? true : false
            }
          }
        }
      ];

      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  } else {
    for (const result of results) {
      const deepLink = result['deeplinkUrl'];
      const price = result['price']['totalAmount'];
      const currency = result['price']['currencyCode'];
      const refun = result['price']['isRefundable'];

      const Legs: TransformedLeg[] = [];
      let Segments: TransformedSegment[] = [];

      const resLegs = Object.values(result['legs']);

      for (const seg of resLegs) {
        const segment = seg['segments'];

        for (const s of segment) {
          const transFormedSegment: TransformedSegmentWithoutID = {
            origin: s.departureAirportCode,
            destination: s.arrivalAirportCode,
            departure: moment
              .utc(s.departureDateTime, 'YYYY-MM-DDTHH:mm:ss')
              .format('YYYYMMDDHHmm'),

            arrival: moment
              .utc(s.arrivalDateTime, 'YYYY-MM-DDTHH:mm:ss')
              .format('YYYYMMDDHHmm'),
            marketingCarrier: s.airlineCode,
            marketingFlightNumber: s.flightNumber
          };
          const segment = buildSegment(transFormedSegment);
          Segments.push(segment);
          transformedResult.segments[segment.id] = segment;
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
        url: deepLink
      });
      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: encodedDeepLink,
          price: {
            amount: price,
            currency: currency
          },
          meta: {
            restrictions: {
              refundable: refun === true ? true : false
            }
          }
        }
      ];

      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  }

  return transformedResult;
};

export default transformResults;
