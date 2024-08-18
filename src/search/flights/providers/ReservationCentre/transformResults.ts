import moment from 'moment';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';
const providerName = 'ReservationCentre';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const filterSegemtData = (flight: any) => {
  const departureDate = `${flight['DepartureDate']}T${flight['DepartureTime']}`;
  const arrivalDate = `${flight['ArrivalDate']}T${flight['ArrivalTime']}`;
  const transFormedSegment: TransformedSegmentWithoutID = {
    origin: flight['Departure'],
    destination: flight['Arrival'],
    departure: moment
      .utc(departureDate, 'YYYY-MM-DDTHH:mm A')
      .format('YYYYMMDDHHmm'),
    arrival: moment
      .utc(arrivalDate, 'YYYY-MM-DDTHH:mm A')
      .format('YYYYMMDDHHmm'),
    marketingCarrier: flight['FlightNumber']['Designator'],
    operatingCarrier: flight['FlightNumber']['Designator'],
    marketingFlightNumber: flight['FlightNumber']['Number'],
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
    codeShare: {}
  };

  if (
    !Data ||
    Object.keys(Data).length === 0 ||
    !Data['FlightItinerary'] ||
    Data['FlightItinerary'].length === 0
  )
    return transformedResult;

  transformedResult.agents[agent.id] = agent;

  const offers = Data['FlightItinerary'];
  for (const offer of offers) {
    const totalPrice = offer.Price.TotalAmount,
      currency = offer.Price.CurrencyCode,
      outboundLeg = offer.OutboundLeg.Segments.FlightSegment;

    let Segments: TransformedSegment[] = [];
    const Legs: TransformedLeg[] = [];
    for (const seg of outboundLeg) {
      const transFormedSegment: TransformedSegmentWithoutID =
        filterSegemtData(seg);
      const Segemnt = buildSegment(transFormedSegment);
      Segments.push(Segemnt);
      transformedResult.segments[Segemnt.id] = Segemnt;
      transformedResult.codeShare[
        `${seg['FlightNumber']['Designator']}${seg['FlightNumber']['Number']}`
      ] = {
        marketingCarrier: seg['FlightNumber']['Designator'],
        operatingCarrier: seg['FlightNumber']['Designator']
      };
    }

    let Leg = buildLegFromSegments(Segments);
    Legs.push(Leg);
    transformedResult.legs[Leg.id] = Leg;
    Segments = [];

    if (input.tripType === 'round') {
      const inboundLeg = offer.InboundLeg.Segments.FlightSegment;
      for (const seg of inboundLeg) {
        const transFormedSegment: TransformedSegmentWithoutID =
          filterSegemtData(seg);
        const Segemnt = buildSegment(transFormedSegment);
        Segments.push(Segemnt);
        transformedResult.segments[Segemnt.id] = Segemnt;
        transformedResult.codeShare[
          `${seg['FlightNumber']['Designator']}${seg['FlightNumber']['Number']}`
        ] = {
          marketingCarrier: seg['FlightNumber']['Designator'],
          operatingCarrier: seg['FlightNumber']['Designator']
        };
      }
      Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
    }
    const url = offer['DeeplinkURL'];
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
          currency
        }
      }
    ];
    transformedResult.itineraries[itinerary.id] = itinerary;
  }
  return transformedResult;
};

export default transformResults;
