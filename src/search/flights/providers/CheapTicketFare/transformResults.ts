import moment from 'moment';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';
const providerName = 'CheapTicketFare';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const filterSegemtData = (flight: any) => {
  const departureDate = `${flight['flightInformation']['productDateTime']['dateOfDeparture']}T${flight['flightInformation']['productDateTime']['timeOfDeparture']}`;
  const arrivalDate = `${flight['flightInformation']['productDateTime']['dateOfArrival']}T${flight['flightInformation']['productDateTime']['timeOfArrival']}`;

  const transFormedSegment: TransformedSegmentWithoutID = {
    origin: flight['flightInformation']['location'][0]['locationId'],
    destination: flight['flightInformation']['location'][1]['locationId'],
    departure: moment.utc(departureDate, 'DDMMYYTHHmm').format('YYYYMMDDHHmm'),
    arrival: moment.utc(arrivalDate, 'DDMMYYTHHmm').format('YYYYMMDDHHmm'),
    marketingCarrier:
      flight['flightInformation']['companyId']['marketingCarrier'],
    operatingCarrier:
      flight['flightInformation']['companyId']['operatingCarrier'],
    marketingFlightNumber: flight['flightInformation']['flightOrtrainNumber'],
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

  if (!Data || Object.keys(Data).length === 0 || !Data['CustomResponse']) {
    transformedResult['error'] = 'No result found';
    return transformedResult;
  }

  const offers = Data['CustomResponse'];
  for (const offer of offers) {
    const totalPrice = offer['paxFareProduct']['totalFare'],
      currency = offer['Currency'];

    const outboundLeg = offer['departureFlights']['flightDetails'];
    let Segments: TransformedSegment[] = [];
    const Legs: TransformedLeg[] = [];
    for (const seg of outboundLeg) {
      const transFormedSegment: TransformedSegmentWithoutID =
        filterSegemtData(seg);
      const Segemnt = buildSegment(transFormedSegment);
      Segments.push(Segemnt);
      transformedResult.segments[Segemnt.id] = Segemnt;
      transformedResult.codeShare[
        `${seg['flightInformation']['companyId']['marketingCarrier']}${seg['flightInformation']['flightOrtrainNumber']}`
      ] = {
        marketingCarrier:
          seg['flightInformation']['companyId']['marketingCarrier'],
        operatingCarrier:
          seg['flightInformation']['companyId']['operatingCarrier'],
        aircraftType: seg['flightInformation']['productDetail']['equipmentType']
      };
    }
    let Leg = buildLegFromSegments(Segments);
    Legs.push(Leg);
    transformedResult.legs[Leg.id] = Leg;
    Segments = [];

    if (input.tripType === 'round') {
      const inboundLeg = offer['returnFlights']['flightDetails'];
      for (const seg of inboundLeg) {
        const transFormedSegment: TransformedSegmentWithoutID =
          filterSegemtData(seg);
        const Segemnt = buildSegment(transFormedSegment);
        Segments.push(Segemnt);
        transformedResult.segments[Segemnt.id] = Segemnt;
        transformedResult.codeShare[
          `${seg['flightInformation']['companyId']['marketingCarrier']}${seg['flightInformation']['flightOrtrainNumber']}`
        ] = {
          marketingCarrier:
            seg['flightInformation']['companyId']['marketingCarrier'],
          operatingCarrier:
            seg['flightInformation']['companyId']['operatingCarrier'],
          aircraftType:
            seg['flightInformation']['productDetail']['equipmentType']
        };
      }
      Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
    }
    const { url } = offer;
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
