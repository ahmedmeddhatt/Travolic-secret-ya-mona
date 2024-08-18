import moment from 'moment';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';
const providerName = 'tripleA';

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

  if (data.length === 0 || Object.keys(data).length === 0) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  for (const item of data) {
    const { SearchResponse, brand } = item;

    if (!SearchResponse || SearchResponse.FlightGroups.length === 0) continue;

    const agent = {
      id: Buffer.from(brand.name).toString('base64'),
      name: brand.name,
      isAirline: true
    };

    transformedResult.agents[agent.id] = agent;

    const { Solutions, FlightGroups } = SearchResponse;

    for (const Solution of Solutions) {
      const { Itinerary, PricingSolutions } = Solution;
      const flightIds = Itinerary.FlightGroupIDs;

      const Legs: TransformedLeg[] = [];

      for (const flightId of flightIds) {
        const { Flights: flights } = FlightGroups.find(
          (item) => item.ID === flightId
        );
        const Segments: TransformedSegment[] = [];

        for (const flight of flights) {
          const {
            Origin,
            Destination,
            MarketingCarrier,
            OperatingCarrier,
            FlightNumber,
            Departure,
            Arrival,
            GeneralEQP
          } = flight;
          const transFormedSegment: TransformedSegmentWithoutID = {
            origin: Origin,
            destination: Destination,
            departure: moment
              .utc(Departure, 'YYYY-MM-DD HH:mm')
              .format('YYYYMMDDHHmm'),
            arrival: moment
              .utc(Arrival, 'YYYY-MM-DD HH:mm')
              .format('YYYYMMDDHHmm'),
            marketingCarrier: MarketingCarrier,
            operatingCarrier: OperatingCarrier,
            marketingFlightNumber: FlightNumber,
            vehicleType: 'FLIGHT'
          };
          const segment = buildSegment(transFormedSegment);

          Segments.push(segment);
          transformedResult.codeShare[`${MarketingCarrier}${FlightNumber}`] = {
            marketingCarrier: MarketingCarrier,
            operatingCarrier: OperatingCarrier
              ? OperatingCarrier
              : MarketingCarrier,
            aircraftType: GeneralEQP
          };
          transformedResult.segments[segment.id] = segment;
        }

        const Leg = buildLegFromSegments(Segments);
        Legs.push(Leg);
        transformedResult.legs[Leg.id] = Leg;
      }
      const redirectPayload: RedirectPayload = {
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: PricingSolutions[0].BookingSolutions[0].Deeplink.Web.Url
      };

      const encodedPayload = encodeRedirectPayload(redirectPayload);

      const itinerary = buildItineraryFromLegs(Legs);

      const pricingOption = {
        agent: agent.id,
        agentName: agent.name,
        deepLink: encodedPayload,
        price: {
          amount: parseFloat(
            PricingSolutions[0].BookingSolutions[0].Price.SolutionPrice.Total
          ),
          currency: PricingSolutions[0].BookingSolutions[0].Price.Currency
        }
      };

      const exisitingItinerary = transformedResult.itineraries[itinerary.id];
      if (exisitingItinerary) {
        let found = false;
        for (
          let index = 0;
          index <
          transformedResult.itineraries[itinerary.id].pricingOptions.length;
          index++
        ) {
          if (
            transformedResult.itineraries[itinerary.id]['pricingOptions'][
              index
            ]['price']['amount'] == pricingOption['price']['amount']
          ) {
            found = true;
            break;
          }
        }
        if (found == false) {
          transformedResult.itineraries[itinerary.id].pricingOptions.push(
            pricingOption
          );
        }
      } else {
        transformedResult.itineraries[itinerary.id] = itinerary;
        transformedResult.itineraries[itinerary.id].pricingOptions = [
          pricingOption
        ];
      }
    }
  }

  return transformedResult;
};

export default transformResults;
