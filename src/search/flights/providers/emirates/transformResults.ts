import moment from 'moment';
import {
  buildLegFromSegments,
  buildSegment,
  buildItineraryFromLegs,
  encodeRedirectPayload
} from '../../../../utils';

const providerName = 'Emirates';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName,
  isAirline: true
};

const classMap: IDictionary<number> = {
  Economy: 0,
  Premium_Economy: 0,
  First: 2,
  Business: 1
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

  const schema =
    data[0]['ns1:XXTransactionResponse'][0].RSP[0].AirShoppingRS[0];

  if (typeof schema.OffersGroup === 'undefined') {
    transformedResult['error'] = 'No results found';
    return transformedResult;
  }

  const offers = schema.OffersGroup[0].AirlineOffers[0].Offer;

  if (offers.length < 1 || typeof offers === 'undefined') {
    transformedResult['error'] = 'No results found';
    return transformedResult;
  }

  if (options.tripType === 'multi') {
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  const dataLists = schema.DataLists[0];
  const currency_metadata =
    schema.Metadata[0].Other[0].OtherMetadata[1].CurrencyMetadatas[0]
      .CurrencyMetadata[0].Decimals[0];

  const flightList = dataLists.FlightList[0].Flight;
  const FlightSegmentList = dataLists.FlightSegmentList[0].FlightSegment;
  const BaggageAllowanceList =
    dataLists.BaggageAllowanceList[0].BaggageAllowance;

  const baggageAllowanceAll = {};
  for (const BaggageAllowance of BaggageAllowanceList) {
    const baggageID = BaggageAllowance.$.BaggageAllowanceID;
    const BaggageCategory = BaggageAllowance.BaggageCategory[0];
    const totalPieces = Number(
      BaggageAllowance.PieceAllowance[0].TotalQuantity[0]
    );
    const AllowanceDescription =
      BaggageAllowance.AllowanceDescription[0].Descriptions[0].Description[0]
        .Text[0];
    let baggageWeight;

    if (BaggageCategory === 'Checked') {
      baggageWeight = AllowanceDescription.split(' ')[1].split('K')[0];
    } else if (BaggageCategory === 'CarryOn') {
      baggageWeight = AllowanceDescription.split(' ')[0]
        .split('Y')[1]
        .split('K')[0];
    }
    baggageAllowanceAll[baggageID] = {
      BaggageCategory,
      AllowanceDescription,
      baggageWeight: Number(baggageWeight),
      totalPieces
    };
  }

  const globalOutBounds = [];
  const globalInBounds = [];

  for (const offer of offers) {
    const inboundFlights = [];
    const outboundFlights = [];

    const priceAndCurrency =
      offer.TotalPrice[0].DetailCurrencyPrice[0].Total[0];
    let price = priceAndCurrency._;

    const { BaggageAllowance } = offer;
    let offerBaggageMeta = {};

    if (
      Object.keys(baggageAllowanceAll).length > 0 &&
      BaggageAllowance.length > 0
    ) {
      const checkedBaggagePieces = [],
        checkedBaggageWeights = [],
        carryOnBaggagePieces = [],
        carryOnBaggageWeights = [];

      for (const baggage of BaggageAllowance) {
        const baggageID = baggage.BaggageAllowanceRef[0];
        const baggageData = baggageAllowanceAll[baggageID];
        if (baggageData.BaggageCategory === 'Checked') {
          if (baggageData.totalPieces > 0) {
            checkedBaggagePieces.push(baggageData.totalPieces);
          }
          if (baggageData.baggageWeight > 0) {
            checkedBaggageWeights.push(baggageData.baggageWeight);
          }
        }

        if (baggageData.BaggageCategory === 'CarryOn') {
          if (baggageData.totalPieces > 0) {
            carryOnBaggagePieces.push(baggageData.totalPieces);
          }

          if (baggageData.baggageWeight > 0) {
            carryOnBaggageWeights.push(baggageData.baggageWeight);
          }
        }
      }

      if (
        checkedBaggagePieces.length > 0 ||
        checkedBaggageWeights.length > 0 ||
        carryOnBaggagePieces.length > 0 ||
        carryOnBaggageWeights.length > 0
      ) {
        offerBaggageMeta = {
          baggage: {
            totalBaggages: Math.max(...checkedBaggagePieces) ?? undefined,
            BaggagesInKilos: Math.max(...checkedBaggageWeights) ?? undefined,
            totalHandbages: Math.max(...carryOnBaggagePieces) ?? undefined,
            HandbagesInKilos: Math.max(...carryOnBaggageWeights) ?? undefined
          }
        };
      }
    }

    if (currency_metadata > 0) {
      price = price.slice(0, -currency_metadata);
    }

    const currency = priceAndCurrency.$.Code;
    const legs = offer.FlightsOverview[0].FlightRef;

    if (legs.length === 1) {
      const flight = flightList.find(
        (item) => item.$.FlightKey === legs[0]['_']
      );
      const segmentsKeys = flight.SegmentReferences[0]._.split(' ');
      const Segments: TransformedSegment[] = [];

      for (const segKey of segmentsKeys) {
        const segmentData = FlightSegmentList.find(
          (item) => item.$.SegmentKey === segKey
        );
        const transformedSegmentWithoutId: TransformedSegmentWithoutID = {
          origin: segmentData.Departure[0].AirportCode[0],
          destination: segmentData.Arrival[0].AirportCode[0],
          departure: moment
            .utc(
              segmentData.Departure[0].Date[0] +
                ' ' +
                segmentData.Departure[0].Time[0],
              'YYYY-MM-DD HH:mm'
            )
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(
              segmentData.Arrival[0].Date[0] +
                ' ' +
                segmentData.Arrival[0].Time[0],
              'YYYY-MM-DD HH:mm'
            )
            .format('YYYYMMDDHHmm'),
          marketingCarrier: segmentData.MarketingCarrier[0].AirlineID[0],
          operatingCarrier: segmentData.OperatingCarrier[0].AirlineID[0],
          marketingFlightNumber:
            segmentData.MarketingCarrier[0].FlightNumber[0],
          vehicleType: 'FLIGHT'
        };
        const segment = buildSegment(transformedSegmentWithoutId);

        transformedResult.codeShare[
          `${segmentData.MarketingCarrier[0].AirlineID[0]}${segmentData.MarketingCarrier[0].FlightNumber[0]}`
        ] = {
          marketingCarrier: segmentData.MarketingCarrier[0].AirlineID[0],
          operatingCarrier: segmentData.OperatingCarrier[0].AirlineID[0],
          aircraftType: segmentData.Equipment[0].AircraftCode
        };

        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
      }

      const Leg = buildLegFromSegments(Segments);

      Leg['price'] = parseFloat(price);

      if (transformedResult.legs[Leg.id]) {
        if (transformedResult.legs[Leg.id]['price'] > Leg['price']) {
          transformedResult.legs[Leg.id]['price'] = Leg['price'];
        }
      } else {
        transformedResult.legs[Leg.id] = Leg;
      }

      if (legs[0].$.ODRef === 'OD1') {
        globalOutBounds.push(Leg);
      } else if (legs[0].$.ODRef === 'OD2') {
        globalInBounds.push(Leg);
      }
    } else {
      for (const leg of legs) {
        const flight = flightList.find((item) => item.$.FlightKey === leg['_']);
        const segmentsKeys = flight.SegmentReferences[0]._.split(' ');
        const Segments: TransformedSegment[] = [];

        for (const segKey of segmentsKeys) {
          const segmentData = FlightSegmentList.find(
            (item) => item.$.SegmentKey === segKey
          );
          const transformedSegmentWithoutId: TransformedSegmentWithoutID = {
            origin: segmentData.Departure[0].AirportCode[0],
            destination: segmentData.Arrival[0].AirportCode[0],
            departure: moment
              .utc(
                segmentData.Departure[0].Date[0] +
                  ' ' +
                  segmentData.Departure[0].Time[0],
                'YYYY-MM-DD HH:mm'
              )
              .format('YYYYMMDDHHmm'),
            arrival: moment
              .utc(
                segmentData.Arrival[0].Date[0] +
                  ' ' +
                  segmentData.Arrival[0].Time[0],
                'YYYY-MM-DD HH:mm'
              )
              .format('YYYYMMDDHHmm'),
            marketingCarrier: segmentData.MarketingCarrier[0].AirlineID[0],
            operatingCarrier: segmentData.OperatingCarrier[0].AirlineID[0],
            marketingFlightNumber:
              segmentData.MarketingCarrier[0].FlightNumber[0]
          };
          const segment = buildSegment(transformedSegmentWithoutId);

          transformedResult.codeShare[
            `${segmentData.MarketingCarrier[0].AirlineID[0]}${segmentData.MarketingCarrier[0].FlightNumber[0]}`
          ] = {
            marketingCarrier: segmentData.MarketingCarrier[0].AirlineID[0],
            operatingCarrier: segmentData.OperatingCarrier[0].AirlineID[0],
            aircraftType: segmentData.Equipment[0].AircraftCode
          };

          Segments.push(segment);
          transformedResult.segments[segment.id] = segment;
        }

        const Leg = buildLegFromSegments(Segments);

        transformedResult.legs[Leg.id] = Leg;

        if (leg.$.ODRef == 'OD1') {
          outboundFlights.push(Leg);
        } else {
          inboundFlights.push(Leg);
        }
      }
    }

    for (const OutLeg of outboundFlights) {
      if (inboundFlights.length > 0) {
        for (const InLeg of inboundFlights) {
          const Legs: TransformedLeg[] = [OutLeg, InLeg];
          const itinerary = buildItineraryFromLegs(Legs);
          const deepLinkPayload = encodeRedirectPayload({
            provider: providerName,
            agentId: agent.id,
            agentName: agent.name,
            url: generateDeepLink(options, OutLeg.origin, OutLeg.destination)
          });
          itinerary.pricingOptions = [
            {
              agent: agent.id,
              agentName: agent.name,
              deepLink: deepLinkPayload,
              price: {
                amount: parseFloat(price),
                currency: currency
              },
              meta:
                Object.keys(offerBaggageMeta).length > 0
                  ? offerBaggageMeta
                  : undefined
            }
          ];
          transformedResult.itineraries[itinerary.id] = itinerary;
        }
      } else {
        const itinerary = buildItineraryFromLegs([OutLeg]);
        const deepLinkPayload = encodeRedirectPayload({
          provider: providerName,
          agentId: agent.id,
          agentName: agent.name,
          url: generateDeepLink(options, OutLeg.origin, OutLeg.destination)
        });
        itinerary.pricingOptions = [
          {
            agent: agent.id,
            agentName: agent.name,
            deepLink: deepLinkPayload,
            price: {
              amount: parseFloat(price),
              currency: currency
            },
            meta:
              Object.keys(offerBaggageMeta).length > 0
                ? offerBaggageMeta
                : undefined
          }
        ];
        transformedResult.itineraries[itinerary.id] = itinerary;
      }
    }

    if (globalOutBounds.length > 0 && globalInBounds.length > 0) {
      for (const globalOutBound of globalOutBounds) {
        for (const globalInBound of globalInBounds) {
          const Legs: TransformedLeg[] = [globalOutBound, globalInBound];
          const itinerary = buildItineraryFromLegs(Legs);
          const deepLinkPayload = encodeRedirectPayload({
            provider: providerName,
            agentId: agent.id,
            agentName: agent.name,
            url: generateDeepLink(
              options,
              globalOutBound.origin,
              globalOutBound.destination
            )
          });
          const pricingOptions = {
            agent: agent.id,
            agentName: agent.name,
            deepLink: deepLinkPayload,
            price: {
              amount: globalOutBound.price + globalInBound.price,
              currency: currency
            },
            meta:
              Object.keys(offerBaggageMeta).length > 0
                ? offerBaggageMeta
                : undefined
          };
          if (transformedResult.itineraries[itinerary.id]) {
            if (
              transformedResult.itineraries[itinerary.id].pricingOptions[0]
                .price.amount > pricingOptions.price.amount
            ) {
              transformedResult.itineraries[itinerary.id].pricingOptions[0] =
                pricingOptions;
            }
          } else {
            itinerary.pricingOptions = [pricingOptions];
            transformedResult.itineraries[itinerary.id] = itinerary;
          }
        }
      }
    }
  }

  return transformedResult;
};

const generateDeepLink = (
  options: SearchOptions,
  origin: string,
  destination: string
): string => {
  let search_type = 'OW';
  let return_date = '';
  if (options.legs.length > 1) {
    search_type = 'SB';
    return_date = options.legs[options.legs.length - 1].departure;
  }
  return `https://www.emirates.com/SessionHandler.aspx?pub=/ae/english&pageurl=/IBE.aspx&section=IBE&TID=${search_type}&resultby=0&j=t&showpage=true&seldcity1=${origin}&selacity1=${destination}&selcabinclass=${
    classMap[options.cabinClass]
  }&selddate1=${options.legs[0].departure}&seladate1=${return_date}&seladults=${
    options.adults
  }&selchildren=${options.children}&selinfants=${options.infants}`;
};

export default transformResults;
