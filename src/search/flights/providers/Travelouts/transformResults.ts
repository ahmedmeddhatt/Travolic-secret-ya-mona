import moment from 'moment';
import {
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs,
  encodeRedirectPayload
} from '../../../../utils';

const providerName = 'Travelouts';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const filterSegemtData = (flight: any) => {
  const departureDate = `${flight['DepartDate']}${flight['DepartTime']}`;
  const arrivalDate = `${flight['ArrivalDate']}${flight['ArrivalTime']}`;
  const transFormedSegment: TransformedSegmentWithoutID = {
    origin: flight['From'][0],
    destination: flight['To'][0],
    departure: moment
      .utc(departureDate, 'DD/MM/YYYYHH:mm')
      .format('YYYYMMDDHHmm'),
    arrival: moment.utc(arrivalDate, 'DD/MM/YYYYHH:mm').format('YYYYMMDDHHmm'),
    marketingCarrier: flight['AirV'][0],
    operatingCarrier: flight['AirV'][0],
    marketingFlightNumber: flight['FltNum'][0],
    vehicleType: 'FLIGHT'
  };
  return transFormedSegment;
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
  if (Object.keys(data).length === 0) return transformedResult;
  transformedResult.agents[agent.id] = agent;
  const allRoutes = data.string.Itineraries[0].Itinerary;
  for (const routes of allRoutes) {
    const { URL: url, TotalPrice: price } = routes;
    const currency = 'USD';
    const SegemntsOut: TransformedSegment[] = [];
    const SegemntsIn: TransformedSegment[] = [];
    const Segments: TransformedSegment[] = [];
    const Legs: TransformedLeg[] = [];
    for (const flight of routes.Sectors[0].AirSector) {
      const transFormedSegment: TransformedSegmentWithoutID =
        filterSegemtData(flight);
      const Segment = buildSegment(transFormedSegment);
      Segments.push(Segment);
      // console.log(typeof flight.isReturn, flight.isReturn[0] === 'false');
      if (flight.isReturn[0] === 'false') SegemntsOut.push(Segment);
      else SegemntsIn.push(Segment);
      transformedResult.segments[Segment.id] = Segment;
    }
    const LegOut = buildLegFromSegments(SegemntsOut);
    Legs.push(LegOut);
    transformedResult.legs[LegOut.id] = LegOut;
    if (options.tripType === 'round') {
      const LegIn = buildLegFromSegments(SegemntsIn);
      Legs.push(LegIn);
      transformedResult.legs[LegIn.id] = LegIn;
    }
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
          amount: price,
          currency: currency
        }
      }
    ];
    transformedResult.itineraries[itinerary.id] = itinerary;
  }
  return transformedResult;
};
export default transformResults;
