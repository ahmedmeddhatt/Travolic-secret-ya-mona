import moment from 'moment';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';
const providerName = 'TheFlightMaster';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const filterSegemtData = (flight: any) => {
  const departureDate = flight['local_departure'];
  const arrivalDate = flight['local_arrival'];

  const transFormedSegment: TransformedSegmentWithoutID = {
    origin: flight['flyFrom'],
    destination: flight['flyTo'],
    departure: moment
      .utc(departureDate, 'YYYYMMDDTHHmm')
      .format('YYYYMMDDHHmm'),
    arrival: moment.utc(arrivalDate, 'YYYYMMDDTHHmm').format('YYYYMMDDHHmm'),
    marketingCarrier: flight['airline'],
    operatingCarrier: flight['operating_carrier'],
    marketingFlightNumber: flight['flight_no'],
    vehicleType: 'FLIGHT'
  };

  return transFormedSegment;
};

const transformResults = (
  input: SearchOptions,
  Data: any
): TransformedResult => {
  const transformedResult: TransformedResult = {
    agents: {},
    segments: {},
    legs: {},
    itineraries: {},
    codeShare: {},
    flightDetails: Data
  };
  transformedResult.agents[agent.id] = agent;

  if (!Data || Data.length === 0) {
    transformedResult['error'] = 'No result found';
    return transformedResult;
  }

  for (const offer of Data) {
    const totalPrice = offer['price_dropdown']['totalamount'];

    let outboundLeg = [];
    const inboundLeg = [];
    if (input.tripType === 'oneway') {
      outboundLeg = offer['route'];
    } else if (input.tripType === 'round') {
      for (const key of Object.keys(offer['route'])) {
        const flight = offer['route'][key];
        if (flight['return'] === 0) {
          outboundLeg.push(flight);
        } else if (flight['return'] === 1) {
          inboundLeg.push(flight);
        }
      }
    }

    let Segments: TransformedSegment[] = [];
    const Legs: TransformedLeg[] = [];
    for (const seg of outboundLeg) {
      const transFormedSegment: TransformedSegmentWithoutID =
        filterSegemtData(seg);
      const Segemnt = buildSegment(transFormedSegment);
      Segments.push(Segemnt);
      transformedResult.segments[Segemnt.id] = Segemnt;

      transformedResult.codeShare[
        `${seg['airline']}${seg['operating_carrier']}`
      ] = {
        marketingCarrier: seg['airline'],
        operatingCarrier: seg['operating_carrier']
      };
    }
    let Leg = buildLegFromSegments(Segments);
    Legs.push(Leg);
    transformedResult.legs[Leg.id] = Leg;
    Segments = [];

    if (input.tripType === 'round' && inboundLeg.length > 0) {
      for (const seg of inboundLeg) {
        const transFormedSegment: TransformedSegmentWithoutID =
          filterSegemtData(seg);
        const Segemnt = buildSegment(transFormedSegment);
        Segments.push(Segemnt);
        transformedResult.segments[Segemnt.id] = Segemnt;

        transformedResult.codeShare[
          `${seg['airline']}${seg['operating_carrier']}`
        ] = {
          marketingCarrier: seg['airline'],
          operatingCarrier: seg['operating_carrier']
        };
      }
      Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
    }
    const { booking_url } = offer;
    const itinerary = buildItineraryFromLegs(Legs);
    const encodedDeepLink = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url: booking_url
    });
    itinerary.pricingOptions = [
      {
        agent: agent.id,
        agentName: agent.name,
        deepLink: encodedDeepLink,
        price: {
          amount: totalPrice,
          currency: input.currency
        }
      }
    ];

    transformedResult.itineraries[itinerary.id] = itinerary;
  }

  return transformedResult;
};
export default transformResults;
