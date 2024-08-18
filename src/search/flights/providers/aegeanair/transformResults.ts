import {
  createConvertDateTime,
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

import moment from 'moment';

const { AEGEAN_REDIRECT_URL } = process.env;

const providerName = 'aegeanair';

const convertDateTime = createConvertDateTime();

const economy = ['Saver', 'Light', 'Flex', 'ComfortFlex'];
const business = ['Business', 'Business_Basic'];

const cabinClassMap = {
  Economy: economy,
  Business: business
};

const agent: IDictionary<string> = {
  id: Buffer.from(providerName).toString('base64'),
  name: 'Aegean Airlines'
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
    Object.keys(data).length === 0 ||
    !data['response']['results'] ||
    data['response'] == undefined
  ) {
    transformedResult['error'] = 'No data found for this route';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  for (const item of data['response']['results']) {
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

    const itineraryLegs = [
      item.outbound_flights[0].legs,
      options.tripType === 'round'
        ? item.return_flights.length > 0
          ? item.return_flights[0].legs
          : []
        : []
    ];
    const Legs: TransformedLeg[] = [];
    const segmentsBookingCodes = {};

    for (const legs of itineraryLegs) {
      if (!legs || legs.length === 0) continue;

      const Segments: TransformedSegment[] = [];

      for (const seg of legs) {
        const { departure, arrival, airline, operator, flightnumber, rbd } =
          seg;
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: departure.airport,
          destination: arrival.airport,
          departure: convertDateTime(departure.date),
          arrival: convertDateTime(arrival.date),
          marketingCarrier: 'A3',
          operatingCarrier: operator.code,
          marketingFlightNumber: flightnumber,
          vehicleType: 'FLIGHT'
        };

        const segment = buildSegment(transFormedSegment);
        Segments.push(segment);
        segmentsBookingCodes[segment.id] = {
          bookingCode: rbd
        };
        transformedResult.codeShare[`${airline.code}${flightnumber}`] = {
          marketingCarrier: 'A3',
          operatingCarrier: operator.code
        };
        transformedResult.segments[segment.id] = segment;
      }

      const Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
    }

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
        },
        meta: {
          segments: segmentsBookingCodes
        }
      }
    ];

    if (itinerary.id in transformedResult.itineraries) {
      if (
        transformedResult.itineraries[itinerary.id].pricingOptions[0].price
          .amount > itinerary.pricingOptions[0].price.amount &&
        options.cabinClass === 'Economy'
      ) {
        transformedResult.itineraries[
          itinerary.id
        ].pricingOptions[0].price.currency =
          itinerary.pricingOptions[0].price.currency;
        transformedResult.itineraries[
          itinerary.id
        ].pricingOptions[0].price.amount =
          itinerary.pricingOptions[0].price.amount;
      } else if (
        transformedResult.itineraries[itinerary.id].pricingOptions[0].price
          .amount < itinerary.pricingOptions[0].price.amount &&
        options.cabinClass === 'Business'
      ) {
        transformedResult.itineraries[
          itinerary.id
        ].pricingOptions[0].price.currency =
          itinerary.pricingOptions[0].price.currency;
        transformedResult.itineraries[
          itinerary.id
        ].pricingOptions[0].price.amount =
          itinerary.pricingOptions[0].price.amount;
      }
    } else {
      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  }

  return transformedResult;
};

const generateDeepLink = (options: SearchOptions) => {
  let trip_type = 'O';
  let return_date = '';
  const date = moment.utc(options.legs[0].departure).format('DD/MM/YYYY');
  if (options.legs.length > 1) {
    trip_type = 'R';
    return_date = moment.utc(options.legs[1].departure).format('DD/MM/YYYY');
    return (
      AEGEAN_REDIRECT_URL +
      `?AirportFrom=${options.legs[0].origin}&AirportTo=${options.legs[0].destination}&TravelType=${trip_type}&DateDeparture=${date}&DateReturn=${return_date}&AdultsNum=${options.adults}&Children12Num=${options.children}&InfantsNum=${options.infants}&Referer=eticket`
    );
  } else {
    return (
      AEGEAN_REDIRECT_URL +
      `?AirportFrom=${options.legs[0].origin}&AirportTo=${options.legs[0].destination}&TravelType=${trip_type}&DateDeparture=${date}&AdultsNum=${options.adults}&Children12Num=${options.children}&InfantsNum=${options.infants}&Referer=eticket`
    );
  }
};

export default transformResults;
