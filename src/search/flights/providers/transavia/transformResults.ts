import {
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs,
  encodeRedirectPayload,
  createConvertDateTime
} from '../../../../utils';

const providerName = 'transavia';
const convertDateTime = createConvertDateTime('YYYY-MM-DDTHH:mm');

const agent: IDictionary<string> = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const transformResults = (options: SearchOptions, data: any) => {
  const transformedResult: TransformedResult = {
    agents: {},
    itineraries: {},
    legs: {},
    segments: {}
  };

  if (!data.flightOffer || data.flightOffer.length === 0) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  for (const item of data.flightOffer) {
    const legs = [item.outboundFlight, item.inboundFlight];
    const Legs: TransformedLeg[] = [];

    for (const leg of legs) {
      if (!leg || legs.length === 0) continue;

      const {
        departureAirport,
        arrivalAirport,
        departureDateTime,
        arrivalDateTime,
        marketingAirline,
        flightNumber
      } = leg;

      const transFormedSegment: TransformedSegmentWithoutID = {
        origin: departureAirport.locationCode,
        destination: arrivalAirport.locationCode,
        departure: convertDateTime(departureDateTime),
        arrival: convertDateTime(arrivalDateTime),
        marketingCarrier: marketingAirline.companyShortName,
        marketingFlightNumber: flightNumber,
        operatingCarrier: 'TO',
        vehicleType: 'FLIGHT'
      };

      const segment = buildSegment(transFormedSegment);

      const transformedLeg = buildLegFromSegments([segment]);

      Legs.push(transformedLeg);
      transformedResult.segments[segment.id] = segment;
      transformedResult.legs[transformedLeg.id] = transformedLeg;
    }

    const itinerary = buildItineraryFromLegs(Legs);

    const deepLinkToken = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url: item.deeplink.href
    });

    itinerary.pricingOptions = [
      {
        agentName: agent.name,
        agent: agent.id,
        deepLink: deepLinkToken,
        price: {
          currency: item.pricingInfoSum.currencyCode,
          amount: item.pricingInfoSum.totalPriceAllPassengers
        }
      }
    ];

    transformedResult.itineraries[itinerary.id] = itinerary;
  }

  return transformedResult;
};

export default transformResults;
