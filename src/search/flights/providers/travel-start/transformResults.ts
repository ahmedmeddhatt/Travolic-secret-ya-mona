import {
  buildSegment,
  createConvertDateTime,
  buildLegFromSegments,
  buildItineraryFromLegs,
  encodeRedirectPayload
} from '../../../../utils';

const providerName = 'Travelstart';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName,
  isAirline: true
};
const convertDateTime = createConvertDateTime();

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
    !data.PricedItineraries ||
    data.PricedItineraries[0].PricedItinerary.length < 1
  ) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  const { PricedItineraries } = data;
  const redirectUrl = data.$.DeepLinkURL;

  for (const PricedItinerary of PricedItineraries[0].PricedItinerary) {
    const { AirItineraryPricingInfo, AirItinerary } = PricedItinerary;
    const totalPrice =
      AirItineraryPricingInfo[0].ItinTotalFare[0].TotalFare[0].$.Amount;
    const currency =
      AirItineraryPricingInfo[0].ItinTotalFare[0].TotalFare[0].$.CurrencyCode;

    const Legs: TransformedLeg[] = [];
    const segmentsBookingCodes = {};
    const totalBaggages = [];
    const totalHandbages = [];
    const BaggagesInKilos = [];
    const HandbagesInKilos = [];
    const legs =
      AirItinerary[0].OriginDestinationOptions[0].OriginDestinationOption;

    for (const leg of legs) {
      const { FlightSegment } = leg;
      const Segments: TransformedSegment[] = [];

      for (const segmentInfo of FlightSegment) {
        const {
          DepartureAirport,
          ArrivalAirport,
          MarketingAirline,
          OperatingAirline,
          FareBaggageAllowance
        } = segmentInfo;

        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: DepartureAirport[0].$.LocationCode,
          destination: ArrivalAirport[0].$.LocationCode,
          departure: convertDateTime(segmentInfo.$.DepartureDateTime),
          arrival: convertDateTime(segmentInfo.$.ArrivalDateTime),
          marketingCarrier: MarketingAirline[0].$.Code,
          operatingCarrier: OperatingAirline[0].$.Code,
          marketingFlightNumber: segmentInfo.$.FlightNumber,
          vehicleType: 'FLIGHT'
        };

        const segment = buildSegment(transFormedSegment);

        Segments.push(segment);
        segmentsBookingCodes[segment.id] = {
          bookingCode: segmentInfo.$.ResBookDesigCode
        };
        transformedResult.codeShare[
          `${MarketingAirline[0].$.Code}${segmentInfo.$.FlightNumber}`
        ] = {
          marketingCarrier: MarketingAirline[0].$.Code,
          operatingCarrier: OperatingAirline[0].$.Code
        };

        if (FareBaggageAllowance) {
          const bagggage = FareBaggageAllowance.find(
            (item) => item.$.BaggageCategory === 'CHECKED'
          );
          const handbag = FareBaggageAllowance.find(
            (item) => item.$.BaggageCategory === 'HAND'
          );

          totalBaggages.push(
            bagggage.$.UnitOfMeasureCode === 'pc'
              ? parseFloat(bagggage.$.UnitOfMeasureQuantity)
              : 0
          );
          BaggagesInKilos.push(
            bagggage.$.UnitOfMeasureCode === 'kg'
              ? parseFloat(bagggage.$.UnitOfMeasureQuantity)
              : 0
          );
          totalHandbages.push(
            handbag.$.UnitOfMeasureCode === 'pc'
              ? parseFloat(handbag.$.UnitOfMeasureQuantity)
              : 0
          );
          HandbagesInKilos.push(
            handbag.$.UnitOfMeasureCode === 'kg'
              ? parseFloat(handbag.$.UnitOfMeasureQuantity)
              : 0
          );
        }

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
      url: `https://www.travelstart.com.eg/booking/flight-details?${
        redirectUrl.split('?')[1]
      }`
    });

    itinerary.pricingOptions = [
      {
        agent: agent.id,
        agentName: agent.name,
        deepLink: deepLinkPayload,
        price: {
          amount: parseFloat(totalPrice),
          currency: currency
        },
        meta: {
          baggage: {
            totalBaggages:
              totalBaggages.length > 0 ? Math.max(...totalBaggages) : undefined,
            BaggagesInKilos:
              BaggagesInKilos.length > 0
                ? Math.max(...BaggagesInKilos)
                : undefined,
            totalHandbages:
              totalHandbages.length > 0
                ? Math.max(...totalHandbages)
                : undefined,
            HandbagesInKilos:
              HandbagesInKilos.length > 0
                ? Math.max(...HandbagesInKilos)
                : undefined
          },
          segments: segmentsBookingCodes
        }
      }
    ];

    if (
      itinerary.pricingOptions[0].price.amount === 0 ||
      itinerary.pricingOptions[0].price.amount < 0
    ) {
      continue;
    }

    transformedResult.itineraries[itinerary.id] = itinerary;
  }

  if (Object.keys(transformedResult.itineraries).length === 0) {
    transformedResult['error'] = 'No data found.';
    transformedResult.agents = {};
    transformedResult.legs = {};
    transformedResult.segments = {};
  }

  return transformedResult;
};

export default transformResults;
