import moment from 'moment';
import queryString from 'query-string';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

const cabinClassMap: IDictionary<string[]> = {
  Economy: ['BASIC', 'SMART'],
  Premium_Economy: ['BASIC', 'SMART'],
  First: [],
  Business: ['BIZclass']
};

const tripTypeMap: IDictionary<string> = {
  round: 'r',
  oneway: 'o'
};

const providerName = 'eurowings';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: 'eurowings',
  isAirline: true
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

  if (
    data === undefined ||
    options.cabinClass === 'First' ||
    (options.tripType === 'round' && data.payload.trips[1] === undefined)
  ) {
    transformedResult['error'] = 'No results found';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  const outboundLegs: TransformedLeg[] = [];
  const inboundLegs: TransformedLeg[] = [];

  const outboundJourneys = data.payload.trips[0].schedules[0].journeys.filter(
    (journey) => {
      journey.fares = journey.fares.filter(
        (fare) =>
          fare.fareName === cabinClassMap[options.cabinClass]?.[0] ||
          fare.fareName === cabinClassMap[options.cabinClass]?.[1]
      );
      return journey.fares.length > 0 ? true : false;
    }
  );

  const inboundJourneys = data.payload.trips[1]
    ? data.payload.trips[1].schedules[0].journeys.filter((journey) => {
        journey.fares = journey.fares.filter(
          (fare) =>
            fare.fareName === cabinClassMap[options.cabinClass]?.[0] ||
            fare.fareName === cabinClassMap[options.cabinClass]?.[1]
        );
        return journey.fares.length > 0 ? true : false;
      })
    : [];

  const lowestFarePriceOutbound = [];
  const lowestFarePriceInbound = [];

  for (const journey of outboundJourneys) {
    for (const fare of journey.fares) {
      const { fareName, farePrices } = fare;
      const total =
        farePrices[0].price.amount * options.adults +
        farePrices[1].price.amount * options.children +
        farePrices[2].price.amount * options.infants;

      lowestFarePriceOutbound.push({
        fareName,
        total,
        currency: farePrices[0].price.currency.code
      });
    }

    const outboundSegments: TransformedSegment[] = [];

    for (const segment of journey.segments) {
      const transformedSegmentWithoutId: TransformedSegmentWithoutID = {
        origin: segment.departureStationCode,
        destination: segment.arrivalStationCode,
        departure: moment(segment.departureDate, 'YYYY-MM-DDTHH:mm:ss').format(
          'YYYYMMDDHHmmss'
        ),
        arrival: moment(segment.arrivalDate, 'YYYY-MM-DDTHH:mm:ss').format(
          'YYYYMMDDHHmmss'
        ),
        marketingCarrier: segment.operator.airlineCode,
        operatingCarrier: segment.operator.operatingAirlineCode,
        marketingFlightNumber: segment.operator.flightNumber,
        vehicleType: segment.operator.aircraftType,
        aircraft: segment.operator.aircraftType
      };
      const built_segment = buildSegment(transformedSegmentWithoutId);

      transformedResult.segments[built_segment.id] = built_segment;
      outboundSegments.push(built_segment);
      transformedResult.codeShare[
        `${segment.operator.airlineCode}${segment.operator.flightNumber}`
      ] = {
        marketingCarrier: segment.operator.airlineCode,
        operatingCarrier: segment.operator.operatingAirlineCode,
        aircraftType: segment.operator.aircraftType
      };
    }

    const leg = buildLegFromSegments(outboundSegments);

    transformedResult.legs[leg.id] = leg;
    outboundLegs.push(leg);
  }

  lowestFarePriceOutbound.sort((a, b) =>
    a.total > b.total ? 1 : b.total > a.total ? -1 : 0
  );

  for (const journey of inboundJourneys) {
    for (const fare of journey.fares) {
      const { fareName, farePrices } = fare;
      const total =
        farePrices[0].price.amount * options.adults +
        farePrices[1].price.amount * options.children +
        farePrices[2].price.amount * options.infants;

      lowestFarePriceInbound.push({
        fareName,
        total,
        currency: farePrices[0].price.currency.code
      });
    }

    const inboundSegments: TransformedSegment[] = [];

    for (const segment of journey.segments) {
      const transformedSegmentWithoutId: TransformedSegmentWithoutID = {
        origin: segment.departureStationCode,
        destination: segment.arrivalStationCode,
        departure: moment(segment.departureDate, 'YYYY-MM-DDTHH:mm:ss').format(
          'YYYYMMDDHHmmss'
        ),
        arrival: moment(segment.arrivalDate, 'YYYY-MM-DDTHH:mm:ss').format(
          'YYYYMMDDHHmmss'
        ),
        marketingCarrier: segment.operator.airlineCode,
        operatingCarrier: segment.operator.operatingAirlineCode,
        marketingFlightNumber: segment.operator.flightNumber,
        vehicleType: segment.operator.aircraftType,
        aircraft: segment.operator.aircraftType
      };

      const built_segment = buildSegment(transformedSegmentWithoutId);

      transformedResult.segments[built_segment.id] = built_segment;
      inboundSegments.push(built_segment);
      transformedResult.codeShare[
        `${segment.operator.airlineCode}${segment.operator.flightNumber}`
      ] = {
        marketingCarrier: segment.operator.airlineCode,
        operatingCarrier: segment.operator.operatingAirlineCode,
        aircraftType: segment.operator.aircraftType
      };
    }

    const leg = buildLegFromSegments(inboundSegments);

    transformedResult.legs[leg.id] = leg;
    inboundLegs.push(leg);
  }

  lowestFarePriceInbound.sort((a, b) =>
    a.total > b.total ? 1 : b.total > a.total ? -1 : 0
  );

  if (options.tripType === 'round') {
    for (const outbound_leg of outboundLegs) {
      for (const inbound_leg of inboundLegs) {
        const itinerary = buildItineraryFromLegs([outbound_leg, inbound_leg]);
        const deepLinkPayload = encodeRedirectPayload({
          provider: providerName,
          agentId: agent.id,
          agentName: agent.name,
          url: make_deepLink(
            options,
            {
              outboundFare: lowestFarePriceOutbound[0].fareName,
              inboundFare: lowestFarePriceInbound[0].fareName
            },
            {
              outboundSegment:
                transformedResult.segments[outbound_leg.segments[0]],
              inboundSegment:
                transformedResult.segments[inbound_leg.segments[0]]
            }
          )
        });

        itinerary.pricingOptions = [
          {
            agent: agent.id,
            agentName: agent.name,
            deepLink: deepLinkPayload,
            price: {
              amount:
                lowestFarePriceOutbound[0].total +
                lowestFarePriceInbound[0].total,
              currency: lowestFarePriceOutbound[0].currency
            }
          }
        ];
        transformedResult.itineraries[itinerary.id] = itinerary;
      }
    }
  } else {
    for (const outbound_leg of outboundLegs) {
      const itinerary = buildItineraryFromLegs([outbound_leg]);
      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: make_deepLink(
          options,
          {
            outboundFare: lowestFarePriceOutbound[0].fareName
          },
          {
            outboundSegment:
              transformedResult.segments[outbound_leg.segments[0]]
          }
        )
      });

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkPayload,
          price: {
            amount: lowestFarePriceOutbound[0].total,
            currency: lowestFarePriceOutbound[0].currency
          }
        }
      ];
      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  }
  return transformedResult;
};

const make_deepLink = (
  options: SearchOptions,
  fares: { outboundFare: string; inboundFare?: string },
  segments: {
    outboundSegment: TransformedSegment;
    inboundSegment?: TransformedSegment;
  }
) => {
  const query = queryString.stringify({
    o: options.legs[0].origin,
    d: options.legs[0].destination,
    t: tripTypeMap[options.tripType],
    od: moment(options.legs[0].departure).format('YYYY-MM-DD'),
    rd:
      tripTypeMap[options.tripType] == 'r'
        ? moment(options.legs[1].departure).format('YYYY-MM-DD')
        : undefined,
    adt: options.adults,
    chd: options.children,
    inf: options.infants,
    lng: 'en-US',
    flnro: segments.outboundSegment.marketingFlightNumber,
    flnrr: segments.inboundSegment
      ? segments.inboundSegment.marketingFlightNumber
      : undefined,
    obf: fares.outboundFare,
    ibf: fares.inboundFare ? fares.inboundFare : undefined,
    gwc: 'travolic'
  });
  return `https://www.eurowings.com/services/ibe/deeplink.html?${query}`;
};

export default transformResults;
