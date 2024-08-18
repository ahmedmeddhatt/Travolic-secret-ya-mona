import moment from 'moment';
import uuid from 'uuid';
import supportedCurrencies from './POS';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';
const { LAFETRAVEL_DEEPLINK } = process.env;
const providerName = 'LafeTravel';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const filterSegemtData = (flight: any) => {
  const departureDate = `${flight['departureDateString']}${flight['departureTime']}`;
  const arrivalDate = `${flight['arrivalDateString']}${flight['arrivalTime']}`;
  const transFormedSegment: TransformedSegmentWithoutID = {
    origin: flight['origin'],
    destination: flight['destination'],
    departure: moment.utc(departureDate, 'DDMMYYHHmm').format('YYYYMMDDHHmm'),
    arrival: moment.utc(arrivalDate, 'DDMMYYHHmm').format('YYYYMMDDHHmm'),
    marketingCarrier: flight['airlineCode'],
    operatingCarrier:
      flight['operatingAirline'] !== null
        ? flight['operatingAirline']
        : flight['airlineCode'],
    marketingFlightNumber: flight['flightNumber'],
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
    segments: {},
    codeShare: {},
    flightDetails: data
  };
  const currency = supportedCurrencies.includes(options.currency)
    ? options.currency
    : 'USD';
  transformedResult.agents[agent.id] = agent;
  if (options.tripType === 'multi' || !data || !data['listOfFlights']) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }
  const routes = data['listOfFlights'];
  const { flightSearchKey } = data;
  for (const route of routes) {
    const totalPrice = route['changeFlightPriceSummary']['grossTotal'];
    const { flightKey } = route;
    let Segments: TransformedSegment[] = [];
    const Legs: TransformedLeg[] = [];
    for (const leg of route['flightBookingSegmentTrips']) {
      if (leg['boundType'] === 1) {
        for (const seg of leg['flightBookingSegments']) {
          const transFormedSegment: TransformedSegmentWithoutID =
            filterSegemtData(seg);
          const segment = buildSegment(transFormedSegment);
          Segments.push(segment);
          transformedResult.segments[segment.id] = segment;
          transformedResult.codeShare[`${seg.airlineCode}${seg.flightNumber}`] =
            {
              marketingCarrier: seg.airlineCode,
              operatingCarrier:
                seg['operatingAirline'] !== null
                  ? seg['operatingAirline']
                  : seg['airlineCode'],
              aircraftType: seg.equipmentNumber
            };
        }
        const Leg = buildLegFromSegments(Segments);
        Legs.push(Leg);
        transformedResult.legs[Leg.id] = Leg;
        Segments = [];
      } else {
        for (const seg of leg['flightBookingSegments']) {
          const transFormedSegment: TransformedSegmentWithoutID =
            filterSegemtData(seg);
          const segment = buildSegment(transFormedSegment);
          Segments.push(segment);
          transformedResult.segments[segment.id] = segment;
          transformedResult.codeShare[`${seg.airlineCode}${seg.flightNumber}`] =
            {
              marketingCarrier: seg.airlineCode,
              operatingCarrier:
                seg['operatingAirline'] !== null
                  ? seg['operatingAirline']
                  : seg['airlineCode'],
              aircraftType: seg.equipmentNumber
            };
        }
        const Leg = buildLegFromSegments(Segments);
        Legs.push(Leg);
        transformedResult.legs[Leg.id] = Leg;
      }
    }
    const sid = uuid.v4();
    const url = `${LAFETRAVEL_DEEPLINK}&Currency=${currency}&fltref=${flightSearchKey}&fltid=${flightKey}&utm_source=t_core_flight&utm_campaign=t_core_flight&utm_medium=1984&sid=${sid}`;
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
          currency: currency
        }
      }
    ];
    transformedResult.itineraries[itinerary.id] = itinerary;
  }
  return transformedResult;
};

export default transformResults;
