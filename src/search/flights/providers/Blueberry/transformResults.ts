import moment from 'moment';
import {
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs,
  encodeRedirectPayload
} from '../../../../utils';
import POS from './pos';

const createID = (flight: any) => {
  const departureDate = `${flight['dDat']}${flight['dTime']}`;
  const arrivalDate = `${flight['aDat']}${flight['aTime']}`;

  const transFormedSegment: TransformedSegmentWithoutID = {
    origin: flight.dApt,
    destination: flight.aApt,
    departure: moment
      .utc(departureDate, 'YYYY-MM-DDHH:mm')
      .format('YYYYMMDDHHmm'),
    arrival: moment.utc(arrivalDate, 'YYYY-MM-DDHH:mm').format('YYYYMMDDHHmm'),
    marketingCarrier: flight.ma,
    operatingCarrier: flight.ma,
    marketingFlightNumber: flight.fn,
    vehicleType: 'FLIGHT'
  };
  return transFormedSegment;
};

const Link = {
  GB: 'https://www.bestairfare.co.uk/Flight/FlightBooking',
  US: 'https://www.dialforflights.com/Flight/FlightBooking'
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
    !POS.country.includes(options.country) ||
    !data ||
    Object.keys(data).length === 0 ||
    !data.results ||
    data.results.length === 0 ||
    !data.GUID
  )
    return transformedResult;
  const providerName = POS.providerName[options.country];
  const globalProviderName = 'Blueberry';
  const agent = {
    id: Buffer.from(providerName).toString('base64'),
    name: providerName
  };

  transformedResult.agents[agent.id] = agent;
  const { GUID } = data;
  if (options.tripType === 'oneway') {
    for (const route of data.results) {
      const FlightId = route['id'];
      const DeepLink = `${
        Link[options.country]
      }?Guid=${GUID}&FId=${FlightId}&Source=TV`;
      const price = route['totalAmt'];
      const currency = route['supplierTags']['supplierCurrency'];
      const segmentsData = route.segments[0].iSeg;
      const Segments: TransformedSegment[] = [];
      const Legs: TransformedLeg[] = [];
      for (const flight of segmentsData) {
        const transFormedSegment: TransformedSegmentWithoutID =
          createID(flight);

        const Segment = buildSegment(transFormedSegment);
        Segments.push(Segment);
        transformedResult.segments[Segment.id] = Segment;
      }

      const Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
      const itinerary = buildItineraryFromLegs(Legs);
      const encodedDeepLink = encodeRedirectPayload({
        provider: globalProviderName,
        agentId: agent.id,
        agentName: agent.name,
        url: DeepLink
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
  } else {
    for (const route of data.results) {
      const FlightId = route['id'];
      const DeepLink = `${
        Link[options.country]
      }?Guid=${GUID}&FId=${FlightId}&Source=TV`;
      const price = route['totalAmt'];
      const currency = route['supplierTags']['supplierCurrency'];
      let segmentsData = route.segments[0].iSeg;
      let Segments: TransformedSegment[] = [];
      const Legs: TransformedLeg[] = [];
      for (const flight of segmentsData) {
        const transFormedSegment: TransformedSegmentWithoutID =
          createID(flight);
        const segment = buildSegment(transFormedSegment);
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
      }
      let Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
      Segments = [];
      segmentsData = route.segments[1].iSeg;
      for (const flight of segmentsData) {
        const transFormedSegment: TransformedSegmentWithoutID =
          createID(flight);

        const segment = buildSegment(transFormedSegment);
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
      }
      Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
      const itinerary = buildItineraryFromLegs(Legs);
      const encodedDeepLink = encodeRedirectPayload({
        provider: globalProviderName,
        agentId: agent.id,
        agentName: agent.name,
        url: DeepLink
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
  }
  return transformedResult;
};
export default transformResults;
