import {
  createConvertDateTime,
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

import moment from 'moment';

const { OLYMPICAIR_REDIRECT_URL } = process.env;

const providerName = 'olympicair';

const convertDateTime = createConvertDateTime();

const agent: IDictionary<string> = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const economy = ['Saver', 'Light', 'Flex', 'ComfortFlex'];
const business = ['Business', 'Business_Basic'];

const cabinClassMap = {
  Economy: economy,
  Business: business
};

const generateDeepLink = (options: SearchOptions, item) => {
  const outbound_flight = item.outbound_flights[0].legs[0];
  const inbound_flight = item.return_flights;
  const date = moment.utc(options.legs[0].departure).format('DD/MM/YYYY');

  if (options.tripType === 'oneway') {
    return `${OLYMPICAIR_REDIRECT_URL}?lang=2&Referer=travolic&AirportFrom=${options.legs[0].origin}&AirportTo=${options.legs[0].destination}&TravelType=O&directFlights=indirect&Btn_DaysRange=3&DateDeparture=${date}&AdultsNum=${options.adults}&Children12Nums=${options.children}&Children5Num=0&InfantsNum=${options.infants}&bounds[0].fareFamily=${options.cabinClass}&bounds[0].flights[0].marketingCarrier=${outbound_flight.operator.code}&bounds[0].flights[0].flightNumber=${outbound_flight.flightnumber}`;
  } else if (options.tripType === 'round') {
    const return_date = moment
      .utc(options.legs[1].departure)
      .format('DD/MM/YYYY');
    return `${OLYMPICAIR_REDIRECT_URL}?lang=2&Referer=travolic&AirportFrom=${options.legs[0].origin}&AirportTo=${options.legs[0].destination}&TravelType=R&directFlights=indirect&Btn_DaysRange=3&DateDeparture=${date}&DateReturn=${return_date}&AdultsNum=${options.adults}&Children12Nums=${options.children}&Children5Num=0&InfantsNum=${options.infants}&bounds[0].fareFamily=${options.cabinClass}&bounds[0].flights[0].marketingCarrier=${outbound_flight.operator.code}&bounds[0].flights[0].flightNumber=${outbound_flight.flightnumber}&bounds[1].fareFamily=${options.cabinClass}&bounds[1].flights[0].marketingCarrier=${inbound_flight[0].legs[0].operator.code}&bounds[1].flights[0].flightNumber=${inbound_flight[0].legs[0].flightnumber}`;
  }
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

  if (
    !data ||
    data.length === 0 ||
    !data[0]['outbound_flights'] ||
    !data[0]['return_flights'] ||
    !data[0]['prices']
  ) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  if (options.tripType === 'oneway') {
    for (const item of data) {
      const Legs: TransformedLeg[] = [];
      const Segments: TransformedSegment[] = [];
      const { prices, outbound_flights } = item;

      if (!outbound_flights) continue;

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

      const itineraryLegs = [outbound_flights[0].legs];
      const price = prices[0].totalamount;

      for (const legs of itineraryLegs) {
        if (!legs || legs.length === 0) continue;

        for (const seg of legs) {
          const { departure, arrival, airline, operator, flightnumber } = seg;
          const transFormedSegment: TransformedSegmentWithoutID = {
            origin: departure.airport,
            destination: arrival.airport,
            departure: convertDateTime(departure.date),
            arrival: convertDateTime(arrival.date),
            marketingCarrier: 'OA',
            operatingCarrier: operator.code,
            marketingFlightNumber: flightnumber,
            vehicleType: 'FLIGHT'
          };

          transformedResult.codeShare[`${airline.code}${flightnumber}`] = {
            marketingCarrier: 'OA',
            operatingCarrier: operator.code
          };

          const segment = buildSegment(transFormedSegment);
          Segments.push(segment);
          transformedResult.segments[segment.id] = segment;
        }

        const Leg = buildLegFromSegments(Segments);
        Legs.push(Leg);
        transformedResult.legs[Leg.id] = Leg;

        const itinerary = buildItineraryFromLegs(Legs);

        const deepLinkPayload = encodeRedirectPayload({
          provider: providerName,
          agentId: agent.id,
          agentName: agent.name,
          url: generateDeepLink(options, item)
        });

        itinerary.pricingOptions = [
          {
            deepLink: deepLinkPayload,
            price: {
              amount: price,
              currency: prices[0].currency
            },
            agent: agent.id,
            agentName: agent.name
          }
        ];

        transformedResult.itineraries[itinerary.id] = itinerary;
      }
    }
  } else {
    for (const item of data) {
      const outSegments: TransformedSegment[] = [];
      const Legs: TransformedLeg[] = [];
      const { prices, outbound_flights, return_flights } = item;

      if (!outbound_flights || !return_flights) continue;

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

      const price = prices[0].totalamount;
      const itineraryLegs = [outbound_flights[0].legs];

      for (const legs of itineraryLegs) {
        if (!legs || legs.length === 0) continue;

        for (const seg of legs) {
          const { departure, arrival, airline, operator, flightnumber } = seg;

          const transFormedSegment: TransformedSegmentWithoutID = {
            origin: departure.airport,
            destination: arrival.airport,
            departure: convertDateTime(departure.date),
            arrival: convertDateTime(arrival.date),
            marketingCarrier: 'OA',
            operatingCarrier: operator.code,
            marketingFlightNumber: flightnumber,
            vehicleType: 'FLIGHT'
          };

          const segment = buildSegment(transFormedSegment);
          outSegments.push(segment);
          transformedResult.segments[segment.id] = segment;

          transformedResult.codeShare[`${airline.code}${flightnumber}`] = {
            marketingCarrier: 'OA',
            operatingCarrier: operator.code
          };
        }
      }

      let Leg = buildLegFromSegments(outSegments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;

      const InSegments: TransformedSegment[] = [];

      const returnLegs = [return_flights[0].legs];
      for (const legs of returnLegs) {
        if (!legs || legs.length === 0) continue;
        for (const seg of legs) {
          const { departure, arrival, airline, operator, flightnumber } = seg;

          const transFormedSegment: TransformedSegmentWithoutID = {
            origin: departure.airport,
            destination: arrival.airport,
            departure: convertDateTime(departure.date),
            arrival: convertDateTime(arrival.date),
            marketingCarrier: 'OA',
            operatingCarrier: operator.code,
            marketingFlightNumber: flightnumber,
            vehicleType: 'FLIGHT'
          };

          const segment = buildSegment(transFormedSegment);
          InSegments.push(segment);
          transformedResult.segments[segment.id] = segment;

          transformedResult.codeShare[`${airline.code}${flightnumber}`] = {
            marketingCarrier: 'OA',
            operatingCarrier: operator.code
          };
        }
      }

      Leg = buildLegFromSegments(InSegments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;

      const itinerary = buildItineraryFromLegs(Legs);

      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: generateDeepLink(options, item)
      });

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkPayload,
          price: {
            amount: price,
            currency: prices[0].currency
          }
        }
      ];

      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  }

  return transformedResult;
};

export default transformResults;
