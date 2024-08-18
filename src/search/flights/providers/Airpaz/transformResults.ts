import moment from 'moment';
import {
  buildLegFromSegments,
  buildSegment,
  buildItineraryFromLegs,
  encodeRedirectPayload
} from '../../../../utils';
import { supportedCurrencies } from './pos';

const providerName = 'Airpaz';
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
    segments: {}
  };

  if (options.tripType === 'multi') {
    transformedResult['error'] = 'No data found';
    return transformedResult;
  }
  if (
    !data ||
    !data['result'] ||
    !data['result']['flights'] ||
    data['result']['flights'].length === 0
  ) {
    transformedResult['error'] = 'No data found';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  const results = data['result']['flights'];
  if (options.tripType === 'oneway') {
    let Legs: TransformedLeg[] = [];
    let Segments: TransformedSegment[] = [];
    results.forEach((flight) => {
      const {
        type,
        depAirport,
        arrAirport,
        depDateTime,
        arrDateTime,
        code,
        traArrDateTime,
        traAirport,
        traDepDateTime
      } = flight.depFlight;
      const segmentResults = [];
      if (type === 'transit') {
        segmentResults.push(
          {
            depAirport: depAirport,
            arrAirport: traAirport,
            depDateTime: depDateTime,
            arrDateTime: traArrDateTime
          },
          {
            depAirport: traAirport,
            arrAirport: arrAirport,
            depDateTime: traDepDateTime,
            arrDateTime: arrDateTime
          }
        );
      }
      if (type === 'direct') {
        segmentResults.push({
          depAirport: depAirport,
          arrAirport: arrAirport,
          depDateTime: depDateTime,
          arrDateTime: arrDateTime
        });
      }

      const deepLinkData = {
        depAirport: options.legs[0].origin,
        arrAirport: options.legs[0].destination,
        retDate: options.legs[1].departure,
        adult: options.adults,
        infant: options.infants,
        child: options.children,
        depDate: options.legs[0].departure,
        currency: !supportedCurrencies.includes(options.currency)
          ? 'USD'
          : options.currency,
        lang: options.language,
        selected: flight
      };
      segmentResults.forEach((item) => {
        const { depAirport, arrAirport, depDateTime, arrDateTime } = item;
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: depAirport,
          destination: arrAirport,
          departure: moment
            .utc(depDateTime, 'YYYY-MM-DD HH:mm:ss')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(arrDateTime, 'YYYY-MM-DD HH:mm:ss')
            .format('YYYYMMDDHHmm'),
          marketingCarrier: code.slice(0, 2),
          operatingCarrier: code.slice(0, 2),
          marketingFlightNumber: code.slice(2),
          vehicleType: 'FLIGHT'
        };
        const segment = buildSegment(transFormedSegment);
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
      });
      const Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
      Segments = [];

      const itinerary = buildItineraryFromLegs(Legs);
      const encodedDeepLink = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        flightData: JSON.stringify(deepLinkData)
      });
      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: encodedDeepLink,
          price: {
            amount: flight.total,
            currency: flight.currency
          }
        }
      ];

      transformedResult.itineraries[itinerary.id] = itinerary;
      Legs = [];
    });
  } else {
    let Legs: TransformedLeg[] = [];
    let Segments: TransformedSegment[] = [];
    results.forEach((flight) => {
      const {
        type,
        depAirport,
        arrAirport,
        depDateTime,
        arrDateTime,
        code,
        traArrDateTime,
        traAirport,
        traDepDateTime
      } = flight.depFlight;
      const deepLinkData = {
        depAirport: options.legs[0].origin,
        arrAirport: options.legs[0].destination,
        retDate: options.legs[1].departure,
        adult: options.adults,
        infant: options.infants,
        child: options.children,
        depDate: options.legs[0].departure,
        currency: !supportedCurrencies.includes(options.currency)
          ? 'USD'
          : options.currency,
        lang: options.language,
        selected: flight
      };
      const segmentResults = [];
      if (type === 'transit') {
        segmentResults.push(
          {
            depAirport: depAirport,
            arrAirport: traAirport,
            depDateTime: depDateTime,
            arrDateTime: traArrDateTime
          },
          {
            depAirport: traAirport,
            arrAirport: arrAirport,
            depDateTime: traDepDateTime,
            arrDateTime: arrDateTime
          }
        );
      }
      if (type === 'direct') {
        segmentResults.push({
          depAirport: depAirport,
          arrAirport: arrAirport,
          depDateTime: depDateTime,
          arrDateTime: arrDateTime
        });
      }

      segmentResults.forEach((item) => {
        const { depAirport, arrAirport, depDateTime, arrDateTime } = item;
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: depAirport,
          destination: arrAirport,
          departure: moment
            .utc(depDateTime, 'YYYY-MM-DD HH:mm:ss')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(arrDateTime, 'YYYY-MM-DD HH:mm:ss')
            .format('YYYYMMDDHHmm'),
          marketingCarrier: code.slice(0, 2),
          operatingCarrier: code.slice(0, 2),
          marketingFlightNumber: code.slice(2),
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

      const segmentResultsReturn = [];
      if (type === 'transit') {
        segmentResultsReturn.push(
          {
            depAirport: flight.retFlight.depAirport,
            arrAirport: flight.retFlight.traAirport,
            depDateTime: flight.retFlight.depDateTime,
            arrDateTime: flight.retFlight.traArrDateTime
          },
          {
            depAirport: flight.retFlight.traAirport,
            arrAirport: flight.retFlight.arrAirport,
            depDateTime: flight.retFlight.traDepDateTime,
            arrDateTime: flight.retFlight.arrDateTime
          }
        );
      }
      if (type === 'direct') {
        segmentResultsReturn.push({
          depAirport: flight.retFlight.depAirport,
          arrAirport: flight.retFlight.arrAirport,
          depDateTime: flight.retFlight.depDateTime,
          arrDateTime: flight.retFlight.arrDateTime
        });
      }

      segmentResultsReturn.forEach((item) => {
        const { depAirport, arrAirport, depDateTime, arrDateTime } = item;
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: depAirport,
          destination: arrAirport,
          departure: moment
            .utc(depDateTime, 'YYYY-MM-DD HH:mm:ss')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(arrDateTime, 'YYYY-MM-DD HH:mm:ss')
            .format('YYYYMMDDHHmm'),
          marketingCarrier: code.slice(0, 2),
          operatingCarrier: code.slice(0, 2),
          marketingFlightNumber: code.slice(2),
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
        flightData: JSON.stringify(deepLinkData)
      });

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: encodedDeepLink,
          price: {
            amount: flight.total,
            currency: flight.currency
          }
        }
      ];

      transformedResult.itineraries[itinerary.id] = itinerary;
      Legs = [];
    });
  }
  return transformedResult;
};

export default transformResults;
