import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

import moment from 'moment';

const providerName = 'Eilago';

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

  if (data.length === 0) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  if (options.tripType === 'oneway') {
    for (const flight of data) {
      const Legs: TransformedLeg[] = [];
      const Segments: TransformedSegment[] = [];

      const currency = flight.companyQuoteDetails[0].Currency;
      for (const trip of flight.onwardFlight) {
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: trip.FlightInfo.DepartureCityCode,
          destination: trip.FlightInfo.ArrivalCityCode,
          departure: moment
            .utc(trip.DepartureDateTime, 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),

          arrival: moment
            .utc(trip.ArrivalDateTime, 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),
          operatingCarrier: flight.OperatingVender,
          marketingCarrier: trip.FlightInfo.FlightCode,
          marketingFlightNumber: trip.FlightInfo.FlightNumber,
          vehicleType: 'FLIGHT'
        };
        const segment = buildSegment(transFormedSegment);
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
      }

      const Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;

      const itinerary = buildItineraryFromLegs(Legs);
      const encodedDeeplink = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: flight.deeplinkURL
      });
      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: encodedDeeplink,
          price: {
            amount: flight.FinalTotalFare,
            currency: currency
          },
          meta: {
            restrictions: {
              refundable: flight.IsRefundable === true ? true : false
            }
          }
        }
      ];

      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  } else if (options.tripType === 'round') {
    data.forEach((flight) => {
      const Legs: TransformedLeg[] = [];
      let Segments: TransformedSegment[] = [];
      const currency = flight.companyQuoteDetails[0].Currency;

      flight['onwardFlight'].forEach((trip) => {
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: trip.FlightInfo.DepartureCityCode,
          destination: trip.FlightInfo.ArrivalCityCode,
          departure: moment
            .utc(trip.DepartureDateTime, 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(trip.ArrivalDateTime, 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),
          operatingCarrier: flight.OperatingVender,
          marketingCarrier: trip.FlightInfo.FlightCode,
          marketingFlightNumber: trip.FlightInfo.FlightNumber,
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

      flight['returnFlight'].forEach((trip) => {
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: trip.FlightInfo.DepartureCityCode,
          destination: trip.FlightInfo.ArrivalCityCode,
          departure: moment
            .utc(trip.DepartureDateTime, 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(trip.ArrivalDateTime, 'YYYY-MM-DDTHH:mm:ss')
            .format('YYYYMMDDHHmm'),
          operatingCarrier: flight.OperatingVender,
          marketingCarrier: trip.FlightInfo.FlightCode,
          marketingFlightNumber: trip.FlightInfo.FlightNumber
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
      const encodedDeeplink = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: flight.deeplinkURL
      });
      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: encodedDeeplink,
          price: {
            amount: flight.FinalTotalFare,
            currency: currency
          },
          meta: {
            restrictions: {
              refundable: flight.IsRefundable === true ? true : false
            }
          }
        }
      ];
      transformedResult.itineraries[itinerary.id] = itinerary;
    });
  } else {
    data.forEach((flight) => {
      const Legs: TransformedLeg[] = [];
      let Segments: TransformedSegment[] = [];
      const currency = flight.companyQuoteDetails[0].Currency;
      flight.Journey.forEach((trip) => {
        trip.Flights.forEach((tripOne) => {
          const transFormedSegment: TransformedSegmentWithoutID = {
            origin: tripOne.FlightInfo.DepartureCityCode,
            destination: tripOne.FlightInfo.ArrivalCityCode,
            departure: moment
              .utc(tripOne.DepartureDateTime, 'YYYY-MM-DDTHH:mm:ss')
              .format('YYYYMMDDHHmm'),
            arrival: moment
              .utc(tripOne.ArrivalDateTime, 'YYYY-MM-DDTHH:mm:ss')
              .format('YYYYMMDDHHmm'),
            operatingCarrier: flight.OperatingVender,

            marketingCarrier: tripOne.FlightInfo.FlightCode,
            marketingFlightNumber: tripOne.FlightInfo.FlightNumber
          };

          const segment = buildSegment(transFormedSegment);
          Segments.push(segment);
          transformedResult.segments[segment.id] = segment;
        });

        const Leg = buildLegFromSegments(Segments);

        Legs.push(Leg);
        transformedResult.legs[Leg.id] = Leg;
        Segments = [];
      });

      const itinerary = buildItineraryFromLegs(Legs);
      const encodedDeeplink = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: flight.deeplinkURL
      });
      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: encodedDeeplink,
          price: {
            amount: flight.FinalTotalFare,
            currency: currency
          },
          meta: {
            restrictions: {
              refundable: flight.IsRefundable === true ? true : false
            }
          }
        }
      ];
      transformedResult.itineraries[itinerary.id] = itinerary;
    });
  }

  if (Object.keys(transformedResult.itineraries).length === 0) {
    transformedResult['error'] = 'No flights found.';
  }

  return transformedResult;
};

export default transformResults;
