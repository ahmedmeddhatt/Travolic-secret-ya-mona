import moment from 'moment';
import {
  buildItineraryFromLegs,
  buildLegFromSegments,
  buildSegment,
  encodeRedirectPayload
} from '../../../../utils';

const providerName = 'thetravelmakers';
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
  if (!data || data.length == 0 || !data['flights']) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }
  transformedResult.agents[agent.id] = agent;
  const flights = data['flights']['flight'];
  if (options.tripType == 'oneway') {
    flights.forEach((flight) => {
      const Legs: TransformedLeg[] = [];
      const Segments: TransformedSegment[] = [];
      const { price, currency, url, marketingAirline, segment, equipment } =
        flight;
      const newLeg = [];
      if (Array.isArray(segment['leg'])) {
        newLeg.push(...segment['leg']);
      } else {
        newLeg.push(segment['leg']);
      }
      newLeg.forEach((segment) => {
        const departureDate = `${segment['departureDate']}${segment['departureTime']}`;
        const arrivalDate = `${segment['arrivalDate']}${segment['arrivalTime']}`;
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: segment['origin'],
          destination: segment['destination'],
          departure: moment
            .utc(departureDate, 'YYYY-MM-DDHH:mm')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(arrivalDate, 'YYYY-MM-DDHH:mm')
            .format('YYYYMMDDHHmm'),
          marketingCarrier: marketingAirline,
          operatingCarrier: marketingAirline,
          marketingFlightNumber: segment['flightNumber'],
          vehicleType: 'FLIGHT'
        };
        const Segment = buildSegment(transFormedSegment);
        Segments.push(Segment);
        transformedResult.segments[Segment.id] = Segment;
        transformedResult.codeShare[
          `${marketingAirline}${segment['flightNumber']}`
        ] = {
          marketingCarrier: marketingAirline,
          operatingCarrier: marketingAirline,
          aircraftType: equipment
        };
      });
      const Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
      const itinerary = buildItineraryFromLegs(Legs);
      const encodedDeepLink = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: url
      });
      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: encodedDeepLink,
          price: {
            amount: price,
            currency: currency
          }
        }
      ];
      transformedResult.itineraries[itinerary.id] = itinerary;
    });
  } else {
    flights.forEach((flight) => {
      const Legs: TransformedLeg[] = [];
      let Segments: TransformedSegment[] = [];
      const { price, currency, url, marketingAirline, segment, equipment } =
        flight;
      const newLeg = [];
      const segData = segment[0]['leg'];
      if (Array.isArray(segData)) {
        newLeg.push(...segData);
      } else {
        newLeg.push(segData);
      }

      newLeg.forEach((segment) => {
        const departureDate = `${segment['departureDate']}${segment['departureTime']}`;
        const arrivalDate = `${segment['arrivalDate']}${segment['arrivalTime']}`;
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: segment['origin'],
          destination: segment['destination'],
          departure: moment
            .utc(departureDate, 'YYYY-MM-DDHH:mm')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(arrivalDate, 'YYYY-MM-DDHH:mm')
            .format('YYYYMMDDHHmm'),
          marketingCarrier: marketingAirline,
          operatingCarrier: marketingAirline,
          marketingFlightNumber: segment['flightNumber'],
          vehicleType: 'FLIGHT'
        };
        const Segment = buildSegment(transFormedSegment);
        Segments.push(Segment);
        transformedResult.segments[Segment.id] = Segment;
        transformedResult.codeShare[
          `${marketingAirline}${segment['flightNumber']}`
        ] = {
          marketingCarrier: marketingAirline,
          operatingCarrier: marketingAirline,
          aircraftType: equipment
        };
      });
      let Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
      Segments = [];
      const newLeg2 = [];
      const segData2 = segment[1]['leg'];
      if (Array.isArray(segData2)) {
        newLeg2.push(...segData2);
      } else {
        newLeg2.push(segData2);
      }

      newLeg2.forEach((segment) => {
        const departureDate = `${segment['departureDate']}${segment['departureTime']}`;
        const arrivalDate = `${segment['arrivalDate']}${segment['arrivalTime']}`;
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: segment['origin'],
          destination: segment['destination'],
          departure: moment
            .utc(departureDate, 'YYYY-MM-DDHH:mm')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(arrivalDate, 'YYYY-MM-DDHH:mm')
            .format('YYYYMMDDHHmm'),
          marketingCarrier: marketingAirline,
          operatingCarrier: marketingAirline,
          marketingFlightNumber: segment['flightNumber'],
          vehicleType: 'FLIGHT'
        };
        const Segment = buildSegment(transFormedSegment);
        Segments.push(Segment);
        transformedResult.segments[Segment.id] = Segment;
        transformedResult.codeShare[
          `${marketingAirline}${segment['flightNumber']}`
        ] = {
          marketingCarrier: marketingAirline,
          operatingCarrier: marketingAirline,
          aircraftType: equipment
        };
      });
      Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;

      const itinerary = buildItineraryFromLegs(Legs);
      const encodedDeepLink = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: url
      });
      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: encodedDeepLink,
          price: {
            amount: price,
            currency: currency
          }
        }
      ];
      transformedResult.itineraries[itinerary.id] = itinerary;
    });
  }
  return transformedResult;
};

export default transformResults;
