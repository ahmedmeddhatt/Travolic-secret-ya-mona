import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs,
  createConvertDateTime
} from '../../../../utils';

const providerName = 'travelpayout';
const convertDateTiem = createConvertDateTime('YYYY-MM-DDTHH:mm');

const filterAgents = [
  'Kuwait Airways',
  'Trip.ae',
  'Qatar Airways',
  'Mytrip.com',
  'Emirates',
  'Cheapfaremart',
  'Flightsmojo',
  'Aegean Airlines',
  'Vayama',
  'Croatia Airlines',
  'Kissandfly.com',
  'Kissandfly',
  'BudgetAir.us',
  'Gotogate',
  'Skybooker',
  'Travomint',
  'Rehlat',
  'TAP Portugal',
  'Budgetair',
  'Trip.com',
  'Pegasus Airlines',
  'FlightNetwork',
  'Travelgenio',
  'Icelandair',
  'Austrian Airlines',
  'SWISS',
  'MyHolidays',
  'DestinaHolidays',
  'Flugladen.de',
  'SuperSaver',
  'BudgetAir.fr',
  'BudgetAir.kr',
  'BudgetAir.es',
  'Travel2be',
  'Eurowings',
  'Farehuts',
  'Air Caraïbes',
  'JetStar'
];

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

  if (data.length === 0) {
    transformedResult['error'] = 'No results found';
    return transformedResult;
  }

  for (const result of data) {
    const { proposals, gates_info, flight_info } = result;

    if (!gates_info) continue;

    const agentFlightDetails = Object.keys(flight_info).reduce((acc, key) => {
      return {
        ...acc,
        [key]: flight_info[key]
      };
    }, {});

    transformedResult.flightDetails = {
      ...transformedResult.flightDetails,
      ...agentFlightDetails
    };

    const gateInfo = gates_info[Object.keys(gates_info)[0]];
    let provider = gateInfo.label;

    // if (gateInfo.label === 'Frenchbee') {
    //   gateInfo.label = 'French Bee';
    //   provider = 'French Bee';
    // }

    // if (gateInfo.label === 'SuperSaver') {
    //   gateInfo.label = 'supersaver';
    //   provider = 'supersaver';
    // }

    // if (gateInfo.label === 'FlightNetwork') {
    //   gateInfo.label = 'flightnetwork';
    //   provider = 'flightnetwork';
    // }

    // if (gateInfo.label === 'Flugladen.de') {
    //   gateInfo.label = 'Flugladen';
    //   provider = 'Flugladen';
    // }

    // if (gateInfo.label === 'SWISS') {
    //   gateInfo.label = 'Swiss';
    //   provider = 'Swiss';
    // }

    // if (gateInfo.label === 'Austrian Airlines') {
    //   gateInfo.label = 'Austrian';
    //   provider = 'Austrian';
    // }

    // if (gateInfo.label === 'DestinaHolidays') {
    //   gateInfo.label = 'Destina Holidays';
    //   provider = 'Destina Holidays';
    // }

    // if (gateInfo.label === 'Gotogate') {
    //   gateInfo.label = 'gotogate';
    //   provider = 'gotogate';
    // }

    // if (gateInfo.label === 'Flydubai') {
    //   gateInfo.label = 'flydubai';
    //   provider = 'flydubai';
    // }

    // if (
    //   gateInfo.label === 'Budgetair' ||
    //   gateInfo.label === 'BudgetAir.us' ||
    //   gateInfo.label === 'BudgetAir.kr' ||
    //   gateInfo.label === 'BudgetAir.fr'
    // ) {
    //   gateInfo.label = 'BudgetAir';
    //   provider = 'BudgetAir';
    // }

    // if (gateInfo.label === 'Trip.ae') {
    //   gateInfo.label = 'trip';
    //   provider = 'trip';
    // }

    // if (gateInfo.label === 'Mytrip.com') {
    //   gateInfo.label = 'mytrip';
    //   provider = 'mytrip';
    // }

    // if (gateInfo.label === 'Trip.com') {
    //   provider = 'tripcom';
    // }

    // if (gateInfo.label === 'TAP Portugal') {
    //   gateInfo.label = 'TAP';
    //   provider = 'TAP';
    // }

    if (gateInfo.label === 'Kiwi.com') {
      gateInfo.label = 'KIWI';
      provider = 'KIWI';
    }

    // if (gateInfo.label === 'Aegean Airlines') {
    //   gateInfo.label = 'aegeanair';
    //   provider = 'aegeanair';
    // }

    // if (gateInfo.label === 'Pegasus Airlines') {
    //   gateInfo.label = 'pegasus';
    //   provider = 'pegasus';
    // }

    // if (gateInfo.label === 'Qatar Airways') {
    //   gateInfo.label = 'qatarairways';
    //   provider = 'qatarairways';
    // }

    const agent = {
      id: Buffer.from(provider).toString('base64'),
      name: gateInfo.label,
      isAirline: gateInfo.is_airline,
      iataCode: gateInfo.is_airline ? gateInfo.airline_iatas[0] : undefined
    };

    if (filterAgents.includes(agent.name) || proposals.length === 0) continue;

    transformedResult.agents = {
      ...transformedResult.agents,
      [agent.id]: agent
    };

    for (const proposal of proposals) {
      const { terms } = proposal;
      const [term]: any = Object.values(terms);
      const totalBaggages = [];
      const totalHandbages = [];
      const BaggagesInKilos = [];
      const HandbagesInKilos = [];
      const segmentsBookingCodes = {};

      const legs = proposal.segment.map((flightLeg, legIndex) => {
        const segments = flightLeg.flight.map((flight, segmentIndex) => {
          const {
            departure,
            arrival,
            departure_date,
            departure_time,
            arrival_date,
            arrival_time,
            number,
            marketing_carrier,
            operating_carrier,
            operated_by,
            trip_class,
            equipment
          } = flight;

          const flightsBaggage = term.flights_baggage[legIndex][segmentIndex];
          const flightsHandbags = term.flights_handbags[legIndex][segmentIndex];
          const transformedSegmentWithoutId: TransformedSegmentWithoutID = {
            origin: departure,
            destination: arrival,
            departure: convertDateTiem(`${departure_date}T${departure_time}`),
            arrival: convertDateTiem(`${arrival_date}T${arrival_time}`),
            marketingCarrier:
              marketing_carrier ||
              (agent.isAirline && proposal.validating_carrier
                ? proposal.validating_carrier
                : operating_carrier),
            operatingCarrier: operated_by || operating_carrier,
            marketingFlightNumber: number,
            vehicleType: 'FLIGHT',
            aircraft: equipment
          };
          const segment = buildSegment(transformedSegmentWithoutId);

          segmentsBookingCodes[segment.id] = {
            bookingCode: trip_class
          };
          transformedResult.codeShare[
            `${transformedSegmentWithoutId.marketingCarrier}${number}`
          ] = {
            marketingCarrier: transformedSegmentWithoutId.marketingCarrier,
            operatingCarrier: transformedSegmentWithoutId.operatingCarrier
          };

          totalBaggages.push(
            flightsBaggage === '' || flightsBaggage === false
              ? 0
              : parseFloat(flightsBaggage.split('PC')[0]) || 0
          );
          totalHandbages.push(
            flightsHandbags === '' || flightsHandbags === false
              ? 0
              : parseFloat(flightsHandbags.split('PC')[0]) || 0
          );
          BaggagesInKilos.push(
            flightsBaggage === '' || flightsBaggage === false
              ? 0
              : parseFloat(flightsBaggage.split('PC')[1]) || 0
          );

          if (flightsHandbags !== '' && flightsHandbags !== false) {
            flightsHandbags.includes('x')
              ? HandbagesInKilos.push(
                  parseFloat(flightsHandbags.split('x')[0].split('PC')[1]) || 0
                )
              : HandbagesInKilos.push(
                  parseFloat(flightsHandbags.split('PC')[1]) || 0
                );
          } else {
            HandbagesInKilos.push(0);
          }

          transformedResult.segments[segment.id] = segment;

          return segment;
        });

        const leg = buildLegFromSegments(segments);
        transformedResult.legs[leg.id] = leg;
        return leg;
      });

      const itinerary = buildItineraryFromLegs(legs);
      const deepLinkToken = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        searchId: result.search_id,
        termUrl: term.url
      });
      const priceOption = {
        agent: agent.id,
        agentName: agent.name,
        price: {
          currency: term.currency.toUpperCase(),
          amount: term.price
        },
        deepLink: deepLinkToken,
        meta: {
          segments: segmentsBookingCodes
        }
      };

      if (
        totalBaggages.length > 0 ||
        BaggagesInKilos.length > 0 ||
        totalHandbages.length > 0 ||
        HandbagesInKilos.length > 0
      ) {
        const totalBaggagesMax = Math.max(...totalBaggages);
        const BaggagesInKilosMax = Math.max(...BaggagesInKilos);
        const totalHandbagesMax = Math.max(...totalHandbages);
        const HandbagesInKilosMax = Math.max(...HandbagesInKilos);
        priceOption['meta']['baggage'] = {
          totalBaggages: totalBaggagesMax > 0 ? totalBaggagesMax : undefined,
          BaggagesInKilos:
            BaggagesInKilosMax > 0 ? BaggagesInKilosMax : undefined,
          totalHandbages: totalHandbagesMax > 0 ? totalHandbagesMax : undefined,
          HandbagesInKilos:
            HandbagesInKilosMax > 0 ? HandbagesInKilosMax : undefined
        };
      }

      if (transformedResult.itineraries[itinerary.id]) {
        let found = false;
        for (
          let index = 0;
          index <
          transformedResult.itineraries[itinerary.id].pricingOptions.length;
          index++
        ) {
          if (
            transformedResult.itineraries[itinerary.id].pricingOptions[index]
              .price.amount == priceOption.price.amount
          ) {
            found = true;
            break;
          }
        }
        if (found == false) {
          transformedResult.itineraries[itinerary.id].pricingOptions.push(
            priceOption
          );
        }
      } else {
        transformedResult.itineraries[itinerary.id] = itinerary;
        transformedResult.itineraries[itinerary.id].pricingOptions = [
          priceOption
        ];
      }
    }
  }

  return transformedResult;
};

export default transformResults;
