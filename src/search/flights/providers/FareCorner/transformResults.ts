import moment from 'moment';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';
const providerName = 'FareCorner';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const filterSegemtData = (flight: any) => {
  const departureDate = flight['DepartureDateTime'];
  const arrivalDate = flight['ArrivalDateTime'];
  const transFormedSegment: TransformedSegmentWithoutID = {
    origin: flight['DepartureAirport']['LocationCode'],
    destination: flight['ArrivalAirport']['LocationCode'],
    departure: moment
      .utc(departureDate, 'YYYY-MM-DDTHH:mm')
      .format('YYYYMMDDHHmm'),
    arrival: moment.utc(arrivalDate, 'YYYY-MM-DDTHH:mm').format('YYYYMMDDHHmm'),
    marketingCarrier: flight['MarketingAirline']['Code'],
    operatingCarrier: flight['OperatingAirline']['Code'],
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
    itineraries: {}
  };
  transformedResult.agents[agent.id] = agent;

  if (!Data || Object.keys(Data).length === 0 || !Data['PricedItineraries'])
    return transformedResult;

  const offers = Data['PricedItineraries']['PricedItinerary'];
  for (const offer of offers) {
    const totalPrice =
      offer['AirItineraryPricingInfo'][0]['ItinTotalFare']['TotalFare'][
        'Amount'
      ];
    const currency =
      offer['AirItineraryPricingInfo'][0]['ItinTotalFare']['TotalFare'][
        'CurrencyCode'
      ];
    const outboundLeg =
      offer['AirItinerary']['OriginDestinationOptions'][
        'OriginDestinationOption'
      ][0]['FlightSegment'];

    let Segments: TransformedSegment[] = [];
    const Legs: TransformedLeg[] = [];
    for (const seg of outboundLeg) {
      const transFormedSegment: TransformedSegmentWithoutID =
        filterSegemtData(seg);
      const Segemnt = buildSegment(transFormedSegment);
      Segments.push(Segemnt);
      transformedResult.segments[Segemnt.id] = Segemnt;
    }
    let Leg = buildLegFromSegments(Segments);
    Legs.push(Leg);
    transformedResult.legs[Leg.id] = Leg;
    Segments = [];

    if (input.tripType === 'round') {
      const inboundLeg =
        offer['AirItinerary']['OriginDestinationOptions'][
          'OriginDestinationOption'
        ][1]['FlightSegment'];
      for (const seg of inboundLeg) {
        const transFormedSegment: TransformedSegmentWithoutID =
          filterSegemtData(seg);
        const Segemnt = buildSegment(transFormedSegment);
        Segments.push(Segemnt);
        transformedResult.segments[Segemnt.id] = Segemnt;
      }
      Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
    }
    const url = offer['redirectUri'];
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
