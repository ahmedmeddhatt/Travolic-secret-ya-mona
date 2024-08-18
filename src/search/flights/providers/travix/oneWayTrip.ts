import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs,
  createConvertDateTime
} from '../../../../utils';

const convertDateTime = createConvertDateTime();

const oneWayTrip = (
  results: any,
  providerName: string,
  transformedResult: TransformedResult
): TransformedResult => {
  for (let data of results) {
    data = data[0];

    const agent: IDictionary<string> = {
      id: Buffer.from(data.market).toString('base64'),
      name: data.market
    };

    if (
      typeof data === 'undefined' ||
      !data.SearchFlightsResponse ||
      !data.SearchFlightsResponse[0].SearchFlightsResult[0].Flights
    )
      continue;

    transformedResult.agents[agent.id] = agent;

    const flights =
      data.SearchFlightsResponse[0].SearchFlightsResult[0].Flights[0].Flight;

    for (const flight of flights) {
      const Legs: TransformedLeg[] = [];
      const Segments: TransformedSegment[] = [];
      const segmentsBookingCodes = {};

      const { FareAmount, TaxAmount, BookLink, OutboundLeg } = flight;

      for (const flightSegment of OutboundLeg[0].Segments[0].FlightSegment) {
        const {
          DepartureAirport,
          ArrivalAirport,
          DepartureDateTime,
          ArrivalDateTime,
          AirlineCode,
          FlightNumber,
          BookingClass,
          EquipmentName
        } = flightSegment;

        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: DepartureAirport[0].AirportCode[0],
          destination: ArrivalAirport[0].AirportCode[0],
          departure: convertDateTime(DepartureDateTime[0]),
          arrival: convertDateTime(ArrivalDateTime[0]),
          marketingCarrier: AirlineCode[0],
          operatingCarrier: AirlineCode[0],
          marketingFlightNumber: FlightNumber[0],
          vehicleType: 'FLIGHT'
        };

        const segment = buildSegment(transFormedSegment);

        transformedResult.codeShare[`${AirlineCode[0]}-${FlightNumber[0]}`] = {
          marketingCarrier: AirlineCode[0],
          operatingCarrier: AirlineCode[0],
          aircraftType: EquipmentName
        };

        Segments.push(segment);
        segmentsBookingCodes[segment.id] = {
          bookingCode: BookingClass[0]
        };
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
        url: BookLink[0]
      });

      const priceOption = {
        agent: agent.id,
        agentName: agent.name,
        deepLink: deepLinkPayload,
        price: {
          amount: parseFloat(
            (FareAmount[0] / 100 + TaxAmount[0] / 100).toString()
          ),
          currency:
            data.SearchFlightsResponse[0].SearchFlightsResult[0].CurrencyCode[0]
        },
        meta: {
          segments: segmentsBookingCodes
        }
      };

      if (transformedResult.itineraries[itinerary.id]) {
        const options =
          transformedResult.itineraries[itinerary.id].pricingOptions;

        for (const option of options) {
          if (
            option.price.amount <= priceOption.price.amount &&
            option.agent === priceOption.agent
          ) {
            transformedResult.itineraries[itinerary.id].pricingOptions.splice(
              transformedResult.itineraries[
                itinerary.id
              ].pricingOptions.indexOf(option),
              1
            );
            break;
          }
        }

        transformedResult.itineraries[itinerary.id].pricingOptions.push(
          priceOption
        );
      } else {
        itinerary.pricingOptions = [priceOption];
        transformedResult.itineraries[itinerary.id] = itinerary;
      }
    }
  }

  return transformedResult;
};

export default oneWayTrip;
