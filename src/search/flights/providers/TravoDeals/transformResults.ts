import moment from 'moment';
import { supportedCurrencies } from './POS';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';
const providerName = 'TravoDeals';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const filterSegemtData = (flight: any) => {
  const departureDate = flight['departureDateTime'];
  const arrivalDate = flight['arrivalDateTime'];
  const transFormedSegment: TransformedSegmentWithoutID = {
    origin: flight['departureAirportCode'],
    destination: flight['arrivalAirportCode'],
    departure: moment
      .utc(departureDate, 'YYYY-MM-DDTHH:mm')
      .format('YYYYMMDDHHmm'),
    arrival: moment.utc(arrivalDate, 'YYYY-MM-DDTHH:mm').format('YYYYMMDDHHmm'),
    marketingCarrier: flight['operatingAirlineCode'],
    operatingCarrier: flight['operatingAirlineCode'],
    marketingFlightNumber: flight['flightNumber'],
    vehicleType: 'FLIGHT'
  };
  return transFormedSegment;
};

const transformResults = (
  input: SearchOptions,
  Data: any
): TransformedResult => {
  const transformedResult = {
    agents: {},
    segments: {},
    legs: {},
    itineraries: {},
    codeShare: {}
  };
  transformedResult.agents[agent.id] = agent;
  if (!Data || !Data['flightItineraries']) return transformedResult;
  const offers = Data['flightItineraries'];
  for (const offer of offers) {
    const totalPrice = offer['price']['totalAmount'];
    const outboundLeg = offer['leg1']['segments'];

    let Segments: TransformedSegment[] = [];
    const Legs: TransformedLeg[] = [];
    for (const seg of outboundLeg) {
      const transFormedSegment: TransformedSegmentWithoutID =
        filterSegemtData(seg);
      const Segemnt = buildSegment(transFormedSegment);
      Segments.push(Segemnt);
      transformedResult.segments[Segemnt.id] = Segemnt;
      transformedResult.codeShare[`${seg.airlineCode}${seg.flightNumber}`] = {
        marketingCarrier: seg.airlineCode,
        operatingCarrier: seg.operatingAirlineCode,
        aircraftType: seg.aircraftCode
      };
    }
    let Leg = buildLegFromSegments(Segments);
    Legs.push(Leg);
    transformedResult.legs[Leg.id] = Leg;
    Segments = [];
    if (input.tripType === 'round') {
      const inboundLeg = offer['leg2']['segments'];
      for (const seg of inboundLeg) {
        const transFormedSegment: TransformedSegmentWithoutID =
          filterSegemtData(seg);
        const Segemnt = buildSegment(transFormedSegment);
        Segments.push(Segemnt);
        transformedResult.segments[Segemnt.id] = Segemnt;
        transformedResult.codeShare[`${seg.airlineCode}${seg.flightNumber}`] = {
          marketingCarrier: seg.airlineCode,
          operatingCarrier: seg.operatingAirlineCode,
          aircraftType: seg.aircraftCode
        };
      }
      Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
    }
    const url = offer['deeplinkUrl'];
    const itinerary = buildItineraryFromLegs(Legs);
    const encodedDeepLink = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url
    });
    itinerary.pricingOptions = [
      {
        agent: agent.id,
        agentName: agent.name,
        deepLink: encodedDeepLink,
        price: {
          amount: totalPrice,
          currency: supportedCurrencies.includes(input.currency)
            ? input.currency
            : 'USD'
        }
      }
    ];
    transformedResult.itineraries[itinerary.id] = itinerary;
  }
  return transformedResult;
};

export default transformResults;
