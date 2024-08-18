import moment from 'moment';
import {
  createConvertDateTime,
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

const providerName = 'croatiaair';

const convertDateTime = createConvertDateTime();

const agent: IDictionary<string> = {
  id: Buffer.from('Croatia Airlines').toString('base64'),
  name: 'Croatia Airlines'
};

const generateDeepLink = (options: SearchOptions) => {
  let trip_type = 'O';
  let return_date = '';
  const date = moment.utc(options.legs[0].departure).format('DD.MM.YYYY');
  if (options.legs.length > 1) {
    trip_type = 'R';
    return_date = moment.utc(options.legs[1].departure).format('DD.MM.YYYY');
  }
  return (
    'https://www.croatiaairlines.com/plan-book/book-a-flight' +
    `?iatafrom=${options.legs[0].origin}&iatato=${options.legs[0].destination}&triptype=${trip_type}&b_date_1=${date}&b_date_2=${return_date}&threedays=true&adult=${options.adults}&children=${options.children}&infant=${options.infants}&senior=0&youth=0&searchresultbyqs=true`
  );
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
    codeShare: {}
  };
  if (!data || !data['response'] || Object.keys(data).length === 0) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  const economy = ['Saver', 'Light', 'Flex', 'ComfortFlex'];
  const business = ['Business', 'Business_Basic'];

  const cabinClassMap = {
    Economy: economy,
    Business: business
  };

  const { results } = data.response;
  if (options.tripType === 'oneway') {
    for (const item of results) {
      let flag = false;
      const classCategories = item.prices[0].class.split(',');
      const selectedClass = cabinClassMap[options.cabinClass];
      if (selectedClass) {
        for (const category of classCategories) {
          if (selectedClass.includes(category)) {
            flag = true;
            break;
          }
        }
      }

      if (!flag) continue;
      const Legs: TransformedLeg[] = [];
      const outSegments: TransformedSegment[] = [];

      for (const outbound_journey of item.outbound_flights[0].legs) {
        const { departure, arrival, airline, flightnumber } = outbound_journey;
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: departure.airport,
          destination: arrival.airport,
          departure: convertDateTime(departure.date),
          arrival: convertDateTime(arrival.date),
          marketingCarrier: airline.code,
          operatingCarrier: airline.code,
          marketingFlightNumber: flightnumber,
          vehicleType: 'FLIGHT'
        };

        const segment = buildSegment(transFormedSegment);

        outSegments.push(segment);
        transformedResult.codeShare[`${airline.code}${flightnumber}`] = {
          marketingCarrier: 'OU',
          operatingCarrier: airline.code
        };
        transformedResult.segments[segment.id] = segment;
      }

      const Leg = buildLegFromSegments(outSegments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
      const itinerary = buildItineraryFromLegs(Legs);

      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: generateDeepLink(options)
      });

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkPayload,
          price: {
            amount: parseFloat(item.prices[0].totalamount),
            currency: item.prices[0].currency
          }
        }
      ];
      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  } else {
    for (const trip of results) {
      let flag = false;
      const classCategories = trip.prices[0].class.split(',');
      const selectedClass = cabinClassMap[options.cabinClass];
      if (selectedClass) {
        for (const category of classCategories) {
          if (selectedClass.includes(category)) {
            flag = true;
            break;
          }
        }
      }

      if (!flag) continue;
      const Legs: TransformedLeg[] = [];
      const outSegments: TransformedSegment[] = [];

      for (const outbound_journey of trip.outbound_flights[0].legs) {
        const { departure, arrival, airline, flightnumber } = outbound_journey;
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: departure.airport,
          destination: arrival.airport,
          departure: convertDateTime(departure.date),
          arrival: convertDateTime(arrival.date),
          marketingCarrier: 'OU',
          operatingCarrier: airline.code,
          marketingFlightNumber: flightnumber,
          vehicleType: 'FLIGHT'
        };

        const segment = buildSegment(transFormedSegment);

        outSegments.push(segment);
        transformedResult.codeShare[`${airline.code}${flightnumber}`] = {
          marketingCarrier: 'OU',
          operatingCarrier: airline.code
        };
        transformedResult.segments[segment.id] = segment;
      }

      let Leg = buildLegFromSegments(outSegments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;

      const InSegments: TransformedSegment[] = [];
      for (const inbound_journey of trip.return_flights[0].legs) {
        const { departure, arrival, airline, flightnumber } = inbound_journey;
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: departure.airport,
          destination: arrival.airport,
          departure: convertDateTime(departure.date),
          arrival: convertDateTime(arrival.date),
          marketingCarrier: airline.code,
          operatingCarrier: airline.code,
          marketingFlightNumber: flightnumber,
          vehicleType: 'FLIGHT'
        };

        const segment = buildSegment(transFormedSegment);
        InSegments.push(segment);
        transformedResult.codeShare[`${airline.code}${flightnumber}`] = {
          marketingCarrier: 'OU',
          operatingCarrier: airline.code
        };
        transformedResult.segments[segment.id] = segment;
      }

      Leg = buildLegFromSegments(InSegments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;

      const itinerary = buildItineraryFromLegs(Legs);

      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: generateDeepLink(options)
      });

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkPayload,
          price: {
            amount: parseFloat(trip.prices[0].totalamount),
            currency: trip.prices[0].currency
          }
        }
      ];
      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  }

  return transformedResult;
};

export default transformResults;
