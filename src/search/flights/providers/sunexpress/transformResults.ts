import moment from 'moment';
import {
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs,
  encodeRedirectPayload
} from '../../../../utils';

const providerName = 'sunexpress';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName,
  isAirline: true
};

const transformResults = (
  options: SearchOptions,
  data: any
): TransformedResult => {
  const transformedResult: TransformedResult = {
    agents: {},
    legs: {},
    itineraries: {},
    segments: {}
  };

  if (
    !data ||
    data == undefined ||
    !data[0]['OffersGroup'] ||
    !data[0]['OffersGroup'][0]['CarrierOffers'][0]['Offer'] ||
    data[0] == 'undefined' ||
    typeof data[0].OffersGroup === 'undefined' ||
    data[0].OffersGroup[0].CarrierOffers[0].Offer.length < 1 ||
    typeof data[0].OffersGroup[0].CarrierOffers[0].Offer === 'undefined'
  ) {
    transformedResult['error'] = 'No data found';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  const inbound_flights = [];
  const outbound_flights = [];
  const outbound_refrences = [];
  const inbound_refrences = [];

  for (const element of data[0].DataLists[0].OriginDestList[0].OriginDest) {
    if (element.OriginCode[0] == options.legs[0].origin) {
      outbound_refrences.push(element.PaxJourneyRefID[0]);
    } else {
      inbound_refrences.push(element.PaxJourneyRefID[0]);
    }
  }

  for (const offer of data[0].OffersGroup[0].CarrierOffers[0].Offer) {
    const Segments: TransformedSegment[] = [];

    for (const leg of offer.OfferItem[0].FareDetail[0].FareComponent) {
      for (const segmentData of data[0].DataLists[0].PaxSegmentList[0]
        .PaxSegment) {
        if (leg.PaxSegmentRefID[0] == segmentData.PaxSegmentID[0]) {
          const segment = buildSegment({
            origin: segmentData.Dep[0].IATA_LocationCode[0],
            destination: segmentData.Arrival[0].IATA_LocationCode[0],
            departure: moment
              .utc(
                segmentData.Dep[0].AircraftScheduledDateTime[0],
                'YYYY-MM-DDTHH:mm'
              )
              .format('YYYYMMDDHHmm'),
            arrival: moment
              .utc(
                segmentData.Arrival[0].AircraftScheduledDateTime[0],
                'YYYY-MM-DDTHH:mm'
              )
              .format('YYYYMMDDHHmm'),
            marketingCarrier:
              segmentData.MarketingCarrierInfo[0].CarrierDesigCode[0],
            operatingCarrier:
              segmentData.OperatingCarrierInfo[0].CarrierDesigCode[0],
            marketingFlightNumber:
              segmentData.MarketingCarrierInfo[0]
                .MarketingCarrierFlightNumberText[0],
            vehicleType: 'FLIGHT'
          });

          Segments.push(segment);
          transformedResult.segments[segment.id] = segment;
        }
      }
    }

    const Leg = buildLegFromSegments(Segments);

    Leg['price'] =
      offer.OfferItem[0].FareDetail[0].FarePriceType[0].Price[0].BaseAmount[0]._;
    Leg['currency'] =
      offer.OfferItem[0].FareDetail[0].FarePriceType[0].Price[0].BaseAmount[0].$.CurCode;
    transformedResult.legs[Leg.id] = Leg;

    if (outbound_refrences.length > 0 && inbound_refrences.length > 0) {
      if (
        outbound_refrences.includes(
          offer.OfferItem[0].Service[0].ServiceAssociations[0]
            .PaxJourneyRefID[0]
        )
      ) {
        outbound_flights.push(Leg);
      } else {
        inbound_flights.push(Leg);
      }
    } else {
      outbound_flights.push(Leg);
    }
  }

  for (const OutLeg of outbound_flights) {
    if (inbound_flights.length > 0) {
      for (const InLeg of inbound_flights) {
        const Legs: TransformedLeg[] = [OutLeg, InLeg];
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
              amount: parseFloat(OutLeg.price) + parseFloat(InLeg.price),
              currency: OutLeg.currency
            }
          }
        ];

        if (transformedResult.itineraries[itinerary.id]) {
          if (
            transformedResult.itineraries[itinerary.id].pricingOptions[0].price
              .amount >
            parseFloat(OutLeg.price) + parseFloat(InLeg.price)
          ) {
            transformedResult.itineraries[itinerary.id] = itinerary;
          }
        } else {
          transformedResult.itineraries[itinerary.id] = itinerary;
        }
      }
    } else {
      const itinerary = buildItineraryFromLegs([OutLeg]);
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
            amount: parseFloat(OutLeg.price),
            currency: OutLeg.currency
          }
        }
      ];

      if (transformedResult.itineraries[itinerary.id]) {
        if (
          transformedResult.itineraries[itinerary.id].pricingOptions[0].price
            .amount > OutLeg.price
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

const currencyMap = {
  EUR: 'DE',
  TRY: 'TR',
  RUB: 'RU',
  GBP: 'GB',
  DKK: 'DK',
  NOK: 'NO',
  SEK: 'SE',
  USD: 'US'
};

const generateDeepLink = (options: SearchOptions) => {
  if (options.tripType == 'oneway') {
    const day = moment(options.legs[0].departure).format('D');
    const year = moment(options.legs[0].departure).format('YYYY');
    const formattedMonth = moment(options.legs[0].departure).format('M');
    let month = moment(formattedMonth, 'MM').format('MMMM');
    month = month.substring(0, 3);
    return `https://www.sunexpress.com/reservation/ibe/booking?mode=searchResultInter&wvm=WVMD&tripType=OW&channel=TRAVOLIC&origin=${
      options.legs[0].origin
    }&destination=${
      options.legs[0].destination
    }&travelDate=${day}-${month}-${year}&adults=${options.adults}&children=${
      options.children
    }&infants=${
      options.infants
    }&cabinClass=ECONOMY&promoCode=&pointOfPurchase=${
      currencyMap[options.currency]
    }&channel=PB&locale=en_US&utm_source=Travolic&utm_medium=coop_CPO&utm_campaign=EN_en_Travolic_Website_Feet`;
  } else {
    const day = moment(options.legs[0].departure).format('D');
    const year = moment(options.legs[0].departure).format('YYYY');
    const formattedMonth = moment(options.legs[0].departure).format('M');
    let month = moment(formattedMonth, 'MM').format('MMMM');
    month = month.substring(0, 3);
    const retDay = moment(options.legs[1].departure).format('D');
    const retyear = moment(options.legs[1].departure).format('YYYY');
    const formattedRetMonth = moment(options.legs[1].departure).format('M');
    let retMonth = moment(formattedRetMonth, 'MM').format('MMMM');
    retMonth = retMonth.substring(0, 3);
    return `https://www.sunexpress.com/reservation/ibe/booking?mode=searchResultInter&wvm=WVMD&tripType=RT&channel=TRAVOLIC&&origin=${
      options.legs[0].origin
    }&destination=${
      options.legs[0].destination
    }&travelDate=${day}-${month}-${year}&travelDate=${retDay}-${retMonth}-${retyear}&adults=${
      options.adults
    }&children=${options.children}&infants=${
      options.infants
    }&cabinClass=ECONOMY&promoCode=&pointOfPurchase=${
      currencyMap[options.currency]
    }&channel=PB&locale=en_US&utm_source=Travolic&utm_medium=coop_CPO&utm_campaign=EN_en_Travolic_Website_Feet`;
  }
};

export default transformResults;
