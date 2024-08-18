import moment from 'moment';
import {
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs,
  encodeRedirectPayload
} from '../../../../utils';

const providerName = 'Avianca';
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
    segments: {},
    codeShare: {}
  };

  if (
    Object.keys(data).length === 0 ||
    typeof data.AirShoppingRS.OffersGroup === 'undefined'
  ) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  const offers =
    data.AirShoppingRS.OffersGroup[0].AirlineOffers[0].AirlineOffer;

  if (offers.length < 1 || typeof offers === 'undefined') {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  const FlightSegmentList =
    data.AirShoppingRS.DataLists[0].FlightSegmentList[0].FlightSegment;
  const originAndDestination =
    data.AirShoppingRS.DataLists[0].OriginDestinationList[0].OriginDestination;

  const inbound_flights = [];
  const outbound_flights = [];
  const outbound_refrences = [];
  const inbound_refrences = [];

  for (const element of originAndDestination) {
    if (element.DepartureCode[0] == options.legs[0].origin) {
      outbound_refrences.push(element.FlightReferences[0]);
    } else {
      inbound_refrences.push(element.FlightReferences[0]);
    }
  }

  const segmentsBookingCodes = {};

  for (const offer of offers) {
    const Legs = offer.PricedOffer[0].OfferPrice[0].FareDetail[0].FareComponent;
    const priceAndCurrency = offer.TotalPrice[0].SimpleCurrencyPrice[0];
    const price = priceAndCurrency._;
    const currency = priceAndCurrency.$.Code;

    for (const leg of Legs) {
      const segmentsKey = leg.SegmentReference[0];
      const Segments: TransformedSegment[] = [];

      for (const segmentData of FlightSegmentList) {
        if (segmentsKey == segmentData.$.SegmentKey) {
          const { Departure, Arrival, MarketingCarrier, OperatingCarrier } =
            segmentData;
          const transformedSegment: TransformedSegmentWithoutID = {
            origin: Departure[0].AirportCode[0],
            destination: Arrival[0].AirportCode[0],
            departure: moment
              .utc(
                Departure[0].Date[0] + ' ' + Departure[0].Time[0],
                'YYYY-MM-DD HH:mm'
              )
              .format('YYYYMMDDHHmm'),
            arrival: moment
              .utc(
                Arrival[0].Date[0] + ' ' + Arrival[0].Time[0],
                'YYYY-MM-DD HH:mm'
              )
              .format('YYYYMMDDHHmm'),
            marketingCarrier: MarketingCarrier[0].AirlineID[0],
            operatingCarrier: OperatingCarrier[0].AirlineID[0],
            marketingFlightNumber: MarketingCarrier[0].FlightNumber[0],
            vehicleType: 'FLIGHT'
          };
          const segment = buildSegment(transformedSegment);

          Segments.push(segment);
          segmentsBookingCodes[segment.id] = {
            bookingCode: leg.FareBasis[0].RBD[0]
          };
          transformedResult.codeShare[
            `${MarketingCarrier[0].AirlineID[0]}${MarketingCarrier[0].FlightNumber[0]}`
          ] = {
            marketingCarrier: MarketingCarrier[0].AirlineID[0],
            operatingCarrier: OperatingCarrier[0].AirlineID[0]
          };
          transformedResult.segments[segment.id] = segment;
        }
      }

      const Leg = buildLegFromSegments(Segments);
      transformedResult.legs[Leg.id] = Leg;

      Leg['price'] = price;
      Leg['currency'] = currency;
      Leg['refrence'] = segmentsKey;
      Leg['flightNumber'] = Segments[0].marketingFlightNumber;

      if (outbound_refrences.length > 0 && inbound_refrences.length > 0) {
        if (outbound_refrences.includes(segmentsKey)) {
          outbound_flights.push(Leg);
        } else {
          inbound_flights.push(Leg);
        }
      } else {
        outbound_flights.push(Leg);
      }
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
          url: `https://controller.avianca.com/api/redirectMetasearch?fi=${OutLeg.departure}&fr=${InLeg.arrival}&cco=${OutLeg.origin}&ccd=${OutLeg.destination}&na=${options.adults}&nn=${options.children}&ni=${options.infants}&fromFlights=AV${OutLeg.flightNumber}&toFlights=AV${InLeg.flightNumber}&lan=EN&backend=PRD&Pais=OTR&utm_source=commission-junction-travolic&utm_medium=cpa&utm_campaign=otr_ot_por_aff_cj_mob_ing_cor_20211101-cj-travolic-core&utm_content=${OutLeg.origin}-${OutLeg.destination}`
        });

        const segments = {};

        for (const segment of OutLeg.segments) {
          segments[segment] = segmentsBookingCodes[segment];
        }

        for (const segment of InLeg.segments) {
          segments[segment] = segmentsBookingCodes[segment];
        }

        itinerary.pricingOptions = [
          {
            agent: agent.id,
            agentName: agent.name,
            deepLink: deepLinkPayload,
            price: {
              amount: parseFloat(OutLeg.price) + parseFloat(InLeg.price),
              currency: OutLeg.currency
            },
            meta: {
              segments
            }
          }
        ];
        if (transformedResult.itineraries[itinerary.id] != undefined) {
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
      const itinerary = buildItineraryFromLegs([OutLeg]);
      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: `https://controller.avianca.com/api/redirectMetasearch?fi=${OutLeg.departure}&cco=${OutLeg.origin}&ccd=${OutLeg.destination}&na=${options.adults}&nn=${options.children}&ni=${options.infants}&fromFlights=AV${OutLeg.flightNumber}&lan=EN&backend=PRD&Pais=OTR&utm_source=commission-junction-travolic&utm_medium=cpa&utm_campaign=otr_ot_por_aff_cj_mob_ing_cor_20211101-cj-travolic-core&utm_content=${OutLeg.origin}-${OutLeg.destination}`
      });

      const segments = {};

      for (const segment of OutLeg.segments) {
        segments[segment] = segmentsBookingCodes[segment];
      }

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkPayload,
          price: {
            amount: parseFloat(OutLeg.price),
            currency: OutLeg.currency
          },
          meta: {
            segments
          }
        }
      ];

      if (transformedResult.itineraries[itinerary.id] != undefined) {
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

export default transformResults;
