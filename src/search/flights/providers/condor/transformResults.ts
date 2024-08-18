import moment from 'moment';
import {
  buildLegFromSegments,
  buildSegment,
  buildItineraryFromLegs,
  encodeRedirectPayload
} from '../../../../utils';

const providerName = 'condor';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName,
  isAirline: true
};

const tripTypesMap: IDictionary<string> = {
  Economy: 'Y',
  Premium_Economy: 'W',
  Business: 'C'
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

  if (Object.keys(data).length === 0) {
    transformedResult['error'] = 'No results found';
    return transformedResult;
  }

  const schema = data.IATA_AirShoppingRS.Response[0];

  if (typeof schema.OffersGroup === 'undefined') {
    transformedResult['error'] = 'No results found';
    return transformedResult;
  }

  const offers = schema.OffersGroup[0].CarrierOffers[0].Offer;

  if (offers.length === 0 || typeof offers === 'undefined') {
    transformedResult['error'] = 'No results found';
    return transformedResult;
  }

  if (options.tripType === 'multi') {
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  const dataLists = schema.DataLists[0];
  const outboundLegs: TransformedLeg[] = [];
  const inboundLegs: TransformedLeg[] = [];

  for (const offer of offers) {
    const { OfferItem, TotalPrice } = offer;
    const price = TotalPrice[0].TotalAmount[0]._;
    const currency = TotalPrice[0].TotalAmount[0].$.CurCode;
    const journeyRef =
      OfferItem[0].Service[0].ServiceAssociations[0].PaxJourneyRefID[0];
    const { PaxSegmentRefID } = dataLists.PaxJourneyList[0].PaxJourney.find(
      (p) => p.PaxJourneyID[0] === journeyRef
    );
    const { DestCode, OriginCode } =
      dataLists.OriginDestList[0].OriginDest.find(
        (o) => o.PaxJourneyRefID[0] === journeyRef
      );
    const Segments: TransformedSegment[] = [];

    for (const segmentRef of PaxSegmentRefID) {
      const segmentData = dataLists.PaxSegmentList[0].PaxSegment.find(
        (p) => p.PaxSegmentID[0] === segmentRef
      );
      const destination = segmentData.Arrival[0].IATA_LocationCode[0];
      const origin = segmentData.Dep[0].IATA_LocationCode[0];
      const departure = segmentData.Dep[0].AircraftScheduledDateTime[0];
      const arrival = segmentData.Arrival[0].AircraftScheduledDateTime[0];
      const marketingCarrier =
        segmentData.MarketingCarrierInfo[0].CarrierDesigCode[0];
      const operatingCarrier =
        segmentData.OperatingCarrierInfo[0].CarrierDesigCode[0];
      const marketingFlightNumber =
        segmentData.MarketingCarrierInfo[0].MarketingCarrierFlightNumberText[0];

      const transformedSegmentWithoutId: TransformedSegmentWithoutID = {
        origin,
        destination,
        departure,
        arrival,
        marketingCarrier,
        operatingCarrier,
        marketingFlightNumber
      };

      const segment = buildSegment(transformedSegmentWithoutId);

      Segments.push(segment);
      transformedResult.segments[segment.id] = segment;
    }

    const Leg = buildLegFromSegments(Segments);

    Leg['price'] = price;
    Leg['currency'] = currency;
    Leg['fare'] = OfferItem[0].FareDetail[0].FareComponent[0].FareBasisCode[0];
    Leg['f-num'] =
      Segments[0].marketingCarrier + Segments[0].marketingFlightNumber;

    if (
      OriginCode[0] === options.legs[0].origin &&
      DestCode[0] === options.legs[0].destination
    ) {
      Leg['OD'] = 'OD1';
      outboundLegs.push(Leg);
    } else {
      Leg['OD'] = 'OD2';
      inboundLegs.push(Leg);
    }

    if (transformedResult.legs[Leg.id]) {
      if (transformedResult.legs[Leg.id]['price'] > Leg['price']) {
        transformedResult.legs[Leg.id] = Leg;
      }
    } else {
      transformedResult.legs[Leg.id] = Leg;
    }
  }

  for (const outboundLeg of outboundLegs) {
    if (inboundLegs.length > 0) {
      for (const inboundLeg of inboundLegs) {
        const Legs: TransformedLeg[] = [outboundLeg, inboundLeg];
        const itinerary = buildItineraryFromLegs(Legs);
        const deepLinkPayload = encodeRedirectPayload({
          provider: providerName,
          agentId: agent.id,
          agentName: agent.name,
          url: deeplinkCreation(options, Legs)
        });

        itinerary.pricingOptions = [
          {
            agent: agent.id,
            agentName: agent.name,
            deepLink: deepLinkPayload,
            price: {
              amount:
                parseFloat(outboundLeg['price']) +
                parseFloat(inboundLeg['price']),
              currency: outboundLeg['currency']
            }
          }
        ];

        if (transformedResult.itineraries[itinerary.id]) {
          if (
            transformedResult.itineraries[itinerary.id].pricingOptions[0].price
              .amount > itinerary.pricingOptions[0].price.amount
          ) {
            transformedResult.itineraries[itinerary.id] = itinerary;
          }
        } else {
          transformedResult.itineraries[itinerary.id] = itinerary;
        }
      }
    } else {
      const Legs: TransformedLeg[] = [outboundLeg];
      const itinerary = buildItineraryFromLegs(Legs);
      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: deeplinkCreation(options, Legs)
      });

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkPayload,
          price: {
            amount: parseFloat(outboundLeg['price']),
            currency: outboundLeg['currency']
          }
        }
      ];

      if (transformedResult.itineraries[itinerary.id]) {
        if (
          transformedResult.itineraries[itinerary.id].pricingOptions[0].price
            .amount > itinerary.pricingOptions[0].price.amount
        ) {
          transformedResult.itineraries[itinerary.id] = itinerary;
        }
      } else {
        transformedResult.itineraries[itinerary.id] = itinerary;
      }
    }
  }

  return transformedResult;
};

const deeplinkCreation = (options: SearchOptions, Legs: TransformedLeg[]) => {
  let deepLink = '';
  if (options.tripType === 'oneway') {
    const market = options.country.toLowerCase();
    const { tripType, cabinClass, adults, children, infants, currency } =
      options;
    const { origin, destination, departure: outboundDate } = options.legs[0];
    const cabinCode = tripTypesMap[cabinClass];

    deepLink = `https://www.condor.com/tca/${market}/flight/search?origin=${origin}&destination=${destination}&outboundDate=${moment(
      outboundDate
    ).format('YYYY-MM-DD')}&outboundDepartureTime=${moment(outboundDate).format(
      'HHMM'
    )}&outboundFlightNumber=${
      Legs[0]['f-num']
    }&flightType=${tripType}&adults=${adults}&children=${children}&infants=${infants}&currency=${currency}&action=confirmFlights&compartment=${cabinCode}&tariff=${
      Legs[0]['fare']
    }`;
  } else if (options.tripType === 'round') {
    const market = options.country.toLowerCase();
    const { tripType, cabinClass, adults, children, infants, currency } =
      options;
    const { origin, destination, departure: outboundDate } = options.legs[0];
    const { departure: inboundDate } = options.legs[1];
    const cabinCode = tripTypesMap[cabinClass];

    deepLink = `https://www.condor.com/tca/${market}/flight/search?origin=${origin}&destination=${destination}&outboundDate=${moment(
      outboundDate
    ).format('YYYY-MM-DD')}&outboundDepartureTime=${moment(outboundDate).format(
      'HHMM'
    )}&outboundFlightNumber=${Legs[0]['f-num']}&inboundDate=${moment(
      inboundDate
    ).format('YYYY-MM-DD')}&inboundDepartureTime=${moment(inboundDate).format(
      'HHMM'
    )}&inboundFlightNumber=${
      Legs[1]['f-num']
    }&flightType=${tripType}&returnOrigin=${destination}&returnDestination=${origin}&adults=${adults}&children=${children}&infants=${infants}&currency=${currency}&action=confirmFlights&compartment=${cabinCode}&tariff=${
      Legs[0]['fare']
    }&inboundTariff=${Legs[1]['fare']}&inboundCompartment=${cabinCode}`;
  }

  return deepLink;
};

export default transformResults;
