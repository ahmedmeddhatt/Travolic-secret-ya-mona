import moment from 'moment';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';
const providerName = 'fare33';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const filterSegemtData = (flight: any) => {
  const departureDate = `${flight['DepartureDate']}T${flight['DepartureTime']}`;
  const arrivalDate = `${flight['ArrivalDate']}T${flight['ArrivalTime']}`;
  const transFormedSegment: TransformedSegmentWithoutID = {
    origin: flight['OriginLocationCode'],
    destination: flight['DestinationLocationCode'],
    departure: moment
      .utc(departureDate, 'YYYY-MM-DDTHH:mm')
      .format('YYYYMMDDHHmm'),
    arrival: moment.utc(arrivalDate, 'YYYY-MM-DDTHH:mm').format('YYYYMMDDHHmm'),
    marketingCarrier: flight['MarketingAirlineCode'],
    operatingCarrier: flight['OperatingAirlineCode'],
    marketingFlightNumber: flight['FlightNumber'],
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
  transformedResult.agents[agent.id] = agent;

  if (Object.keys(Data['data']).length === 0 || !Data || !Data['data']) {
    return transformedResult;
  }

  const offers = Data['data']['flights'];
  for (const offer of offers) {
    const passengersQuantities = offer['passengerQuantity'],
      currency = offer['pricingInfo']['TotalFare_CurrencyCode'];

    let passngerCount = 0,
      totalPrice;
    for (const passengerQuantity of passengersQuantities) {
      if (
        passengerQuantity['Code'] === 'ADT' ||
        passengerQuantity['Code'] === 'CNN'
      )
        passngerCount += passengerQuantity['Quantity'];
    }

    if (passngerCount !== 0) {
      totalPrice = passngerCount * offer['pricingInfo']['TotalFare'];
    } else {
      totalPrice = offer['pricingInfo']['TotalFare'];
    }

    const outboundLeg = offer['flightSegments'][0]['Segments'];

    let Segments: TransformedSegment[] = [];
    const Legs: TransformedLeg[] = [];
    for (const seg of outboundLeg) {
      const transFormedSegment: TransformedSegmentWithoutID =
        filterSegemtData(seg);
      const Segemnt = buildSegment(transFormedSegment);
      Segments.push(Segemnt);
      transformedResult.segments[Segemnt.id] = Segemnt;
      transformedResult.codeShare[
        `${seg['MarketingAirlineCode']}${seg['FlightNumber']}`
      ] = {
        marketingCarrier: seg['MarketingAirlineCode'],
        operatingCarrier: seg['OperatingAirlineCode'],
        aircraftType: seg['aircraft']
      };
    }
    let Leg = buildLegFromSegments(Segments);
    Legs.push(Leg);
    transformedResult.legs[Leg.id] = Leg;
    Segments = [];

    if (input.tripType === 'round') {
      const inboundLeg = offer['flightSegments'][1]['Segments'];
      for (const seg of inboundLeg) {
        const transFormedSegment: TransformedSegmentWithoutID =
          filterSegemtData(seg);
        const Segemnt = buildSegment(transFormedSegment);
        Segments.push(Segemnt);
        transformedResult.segments[Segemnt.id] = Segemnt;
        transformedResult.codeShare[
          `${seg['MarketingAirlineCode']}${seg['FlightNumber']}`
        ] = {
          marketingCarrier: seg['MarketingAirlineCode'],
          operatingCarrier: seg['OperatingAirlineCode'],
          aircraftType: seg['aircraft']
        };
      }
      Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
    }
    const url = offer['deepLink'];
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
