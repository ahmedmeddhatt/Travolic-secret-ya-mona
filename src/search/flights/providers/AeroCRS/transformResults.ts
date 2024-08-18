import moment from 'moment';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

const providerName = 'aerocrs';

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

  if (
    Object.keys(data).length === 0 ||
    data.aerocrs.flights.flight === 'No Results'
  ) {
    transformedResult['error'] = 'No results found';
    return transformedResult;
  }

  const flights = data.aerocrs.flights.flight;

  if (options.tripType === 'round') {
    const outboundFlights = flights.filter(
      (flight) => flight.direction === 'outbound'
    );
    const inboundFlights = flights.filter(
      (flight) => flight.direction === 'inbound'
    );

    const outboundSegments: TransformedSegment[] = [];
    const inboundSegments: TransformedSegment[] = [];
    const outboundLegs: TransformedLeg[] = [];
    const inboundLegs: TransformedLeg[] = [];
    const { deeplink } = outboundFlights[0];
    for (const outboundFlight of outboundFlights) {
      const {
        fromcode,
        tocode,
        STD,
        STA,
        airlineDesignator,
        flightcode,
        classes,
        airlineName
      } = outboundFlight;
      const transformedSegmentWithoutId: TransformedSegmentWithoutID = {
        origin: fromcode,
        destination: tocode,
        departure: moment(STD, 'YYYY/MM/DD HH:mm:ss').format('YYYYMMDDHHmmss'),
        arrival: moment(STA, 'YYYY/MM/DD HH:mm:ss').format('YYYYMMDDHHmmss'),
        marketingCarrier: airlineDesignator,
        operatingCarrier: airlineDesignator,
        marketingFlightNumber: flightcode,
        vehicleType: 'FLIGHT'
      };

      const segment = buildSegment(transformedSegmentWithoutId);

      transformedResult.segments[segment.id] = segment;
      outboundSegments.push(segment);

      const leg = buildLegFromSegments([segment]);

      leg['tax'] = Object.values(classes)[0]['fare']['tax'];
      leg['adultFare'] = Object.values(classes)[0]['fare']['adultFare'];
      leg['childFare'] = Object.values(classes)[0]['fare']['childFare'];
      leg['infantFare'] = Object.values(classes)[0]['fare']['infantFare'];
      leg['currency'] = Object.values(classes)[0]['currency'];
      leg['airlineName'] = airlineName;
      leg['baggageAllowanceWeight'] =
        Object.values(classes)[0]['baggageAllowance'];

      transformedResult.legs[leg.id] = leg;
      outboundLegs.push(leg);
    }

    for (const inboundFlight of inboundFlights) {
      const {
        fromcode,
        tocode,
        STD,
        STA,
        airlineDesignator,
        flightcode,
        classes
      } = inboundFlight;
      const transformedSegmentWithoutId: TransformedSegmentWithoutID = {
        origin: fromcode,
        destination: tocode,
        departure: moment(STD, 'YYYY/MM/DD HH:mm:ss').format('YYYYMMDDHHmmss'),
        arrival: moment(STA, 'YYYY/MM/DD HH:mm:ss').format('YYYYMMDDHHmmss'),
        marketingCarrier: airlineDesignator,
        operatingCarrier: airlineDesignator,
        marketingFlightNumber: flightcode,
        vehicleType: 'FLIGHT'
      };

      const segment = buildSegment(transformedSegmentWithoutId);

      transformedResult.segments[segment.id] = segment;
      inboundSegments.push(segment);

      const leg = buildLegFromSegments([segment]);

      leg['tax'] = Object.values(classes)[0]['fare']['tax'];
      leg['adultFare'] = Object.values(classes)[0]['fare']['adultFare'];
      leg['childFare'] = Object.values(classes)[0]['fare']['childFare'];
      leg['infantFare'] = Object.values(classes)[0]['fare']['infantFare'];
      leg['currency'] = Object.values(classes)[0]['currency'];
      leg['baggageAllowanceWeight'] =
        Object.values(classes)[0]['baggageAllowance'];

      transformedResult.legs[leg.id] = leg;
      inboundLegs.push(leg);
    }

    for (const outboundLeg of outboundLegs) {
      const baggageWeights = [];
      baggageWeights.push(Number(outboundLeg['baggageAllowanceWeight']));
      for (const inboundLeg of inboundLegs) {
        baggageWeights.push(Number(inboundLeg['baggageAllowanceWeight']));
        const agent: IDictionary<string> = {
          id: Buffer.from(outboundLeg['airlineName']).toString('base64'),
          name: outboundLeg['airlineName']
        };

        transformedResult.agents[agent.id] = agent;

        const itinerary = buildItineraryFromLegs([outboundLeg, inboundLeg]);

        const deepLinkPayload = encodeRedirectPayload({
          provider: providerName,
          agentId: agent.id,
          agentName: agent.name,
          url: deeplink
        });
        const price =
          parseFloat(outboundLeg['tax']) +
          parseFloat(inboundLeg['tax']) +
          parseFloat(outboundLeg['adultFare']) * options.adults +
          parseFloat(inboundLeg['adultFare']) * options.adults +
          parseFloat(inboundLeg['childFare']) * options.children +
          parseFloat(outboundLeg['childFare']) * options.children +
          parseFloat(inboundLeg['infantFare']) * options.infants +
          parseFloat(outboundLeg['infantFare']) * options.infants;

        const priceOption = {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkPayload,
          price: {
            amount: price,
            currency: outboundLeg['currency']
          },
          meta: {
            baggage: {
              BaggagesInKilos:
                baggageWeights.length > 0
                  ? Math.max(...baggageWeights)
                  : undefined
            }
          }
        };

        itinerary.pricingOptions = [priceOption];
        transformedResult.itineraries[itinerary.id] = itinerary;
      }
    }
  } else if (options.tripType === 'oneway') {
    const Segments: TransformedSegment[] = [];
    const Legs: TransformedLeg[] = [];
    const { deeplink } = flights[0];

    for (const flight of flights) {
      const {
        fromcode,
        tocode,
        STD,
        STA,
        airlineDesignator,
        flightcode,
        classes,
        airlineName
      } = flight;
      const transformedSegmentWithoutId: TransformedSegmentWithoutID = {
        origin: fromcode,
        destination: tocode,
        departure: moment(STD, 'YYYY/MM/DD HH:mm:ss').format('YYYYMMDDHHmmss'),
        arrival: moment(STA, 'YYYY/MM/DD HH:mm:ss').format('YYYYMMDDHHmmss'),
        marketingCarrier: airlineDesignator,
        operatingCarrier: airlineDesignator,
        marketingFlightNumber: flightcode
      };

      const agent: IDictionary<string> = {
        id: Buffer.from(airlineName).toString('base64'),
        name: airlineName
      };

      transformedResult.agents[agent.id] = agent;

      const segment = buildSegment(transformedSegmentWithoutId);

      transformedResult.segments[segment.id] = segment;
      Segments.push(segment);

      const leg = buildLegFromSegments([segment]);

      leg['tax'] = Object.values(classes)[0]['fare']['tax'];
      leg['adultFare'] = Object.values(classes)[0]['fare']['adultFare'];
      leg['childFare'] = Object.values(classes)[0]['fare']['childFare'];
      leg['infantFare'] = Object.values(classes)[0]['fare']['infantFare'];
      leg['currency'] = Object.values(classes)[0]['currency'];
      leg['baggageAllowanceWeight'] =
        Object.values(classes)[0]['baggageAllowance'];

      transformedResult.legs[leg.id] = leg;
      Legs.push(leg);

      const itinerary = buildItineraryFromLegs(Legs);
      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: deeplink
      });

      const price =
        parseFloat(Legs[0]['tax']) +
        parseFloat(Legs[0]['adultFare']) * options.adults +
        parseFloat(Legs[0]['childFare']) * options.children +
        parseFloat(Legs[0]['infantFare']) * options.infants;

      const baggageWeight = leg['baggageAllowanceWeight'];
      const priceOption = {
        agent: agent.id,
        agentName: agent.name,
        deepLink: deepLinkPayload,
        price: {
          amount: price,
          currency: Legs[0]['currency']
        },
        meta: {
          baggage: {
            BaggagesInKilos: baggageWeight ? Number(baggageWeight) : undefined
          }
        }
      };

      itinerary.pricingOptions = [priceOption];
      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  }

  return transformedResult;
};

export default transformResults;
