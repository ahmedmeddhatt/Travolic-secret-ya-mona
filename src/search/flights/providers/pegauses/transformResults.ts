import moment from 'moment';
import {
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs,
  encodeRedirectPayload
} from '../../../../utils';

const providerName = 'pegasus';
const agent = {
  id: Buffer.from('Pegasus Airlines').toString('base64'),
  name: 'Pegasus Airlines',
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
    flightDetails: data
  };

  if (Object.keys(data).length === 0) {
    transformedResult['error'] = 'No results found';
    return transformedResult;
  }

  const schema = data[0]['ns2:AirShoppingRS'][0];

  if (typeof schema['ns2:OffersGroup'] === 'undefined') {
    transformedResult['error'] = 'No results found';
    return transformedResult;
  }

  const offers =
    schema['ns2:OffersGroup'][0]['ns2:AirlineOffers'][0]['ns2:Offer'];

  if (offers.length < 1 || typeof offers === 'undefined') {
    transformedResult['error'] = 'No results found';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  const dataLists = schema['ns2:DataLists'][0];

  const currency_metadata =
    schema['ns2:Metadata'][0]['ns2:Other'][0]['ns2:OtherMetadata'][0][
      'ns2:CurrencyMetadatas'
    ][0]['ns2:CurrencyMetadata'][0]['ns2:Decimals'][0];

  const flightList = dataLists['ns2:FlightList'][0]['ns2:Flight'];

  const FlightSegmentList =
    dataLists['ns2:FlightSegmentList'][0]['ns2:FlightSegment'];

  const originAndDestination =
    dataLists['ns2:OriginDestinationList'][0]['ns2:OriginDestination'];

  const inbound_flights = [];
  const outbound_flights = [];
  let outbound_refrences = [];
  let inbound_refrences = [];

  if (originAndDestination.length == 2) {
    outbound_refrences =
      originAndDestination[0]['ns2:FlightReferences'][0].split(' ');
    inbound_refrences =
      originAndDestination[1]['ns2:FlightReferences'][0].split(' ');
  } else {
    outbound_refrences =
      originAndDestination[0]['ns2:FlightReferences'][0].split(' ');
  }

  for (const offer of offers) {
    const leg = offer['ns2:FlightsOverview'][0]['ns2:FlightRef'][0];
    const priceAndCurrency =
      offer['ns2:OfferItem'][0]['ns2:TotalPriceDetail'][0][
        'ns2:TotalAmount'
      ][0]['ns2:SimpleCurrencyPrice'][0];
    let price = priceAndCurrency['_'];
    if (currency_metadata > 0) {
      price = price.slice(0, -currency_metadata);
    }
    const currency = priceAndCurrency['$']['Code'];

    for (const legData of flightList) {
      const legKey = legData['$']['FlightKey'];
      if (legKey === leg) {
        const segmentsKeys = legData['ns2:SegmentReferences'][0].split(' ');

        const Segments = [];
        segmentsKeys.forEach((segmentsKey) => {
          FlightSegmentList.forEach(async (segmentData) => {
            if (segmentsKey == segmentData['$']['SegmentKey']) {
              const segment = buildSegment({
                origin: segmentData['ns2:Departure'][0]['ns2:AirportCode'][0],
                destination:
                  segmentData['ns2:Arrival'][0]['ns2:AirportCode'][0],
                departure: moment
                  .utc(
                    segmentData['ns2:Departure'][0]['ns2:Date'][0] +
                      ' ' +
                      segmentData['ns2:Departure'][0]['ns2:Time'][0],
                    'YYYY-MM-DD HH:mm'
                  )
                  .format('YYYYMMDDHHmm'),
                arrival: moment
                  .utc(
                    segmentData['ns2:Arrival'][0]['ns2:Date'][0] +
                      ' ' +
                      segmentData['ns2:Arrival'][0]['ns2:Time'][0],
                    'YYYY-MM-DD HH:mm'
                  )
                  .format('YYYYMMDDHHmm'),
                marketingCarrier:
                  segmentData['ns2:MarketingCarrier'][0]['ns2:AirlineID'][0],
                operatingCarrier:
                  segmentData['ns2:OperatingCarrier'][0]['ns2:AirlineID'][0],
                marketingFlightNumber:
                  segmentData['ns2:MarketingCarrier'][0]['ns2:FlightNumber'][0],
                vehicleType: 'FLIGHT'
              });
              Segments.push(segment);
              transformedResult.segments[segment.id] = segment;
            }
          });
        });
        const Leg = buildLegFromSegments(Segments);
        transformedResult.legs[Leg.id] = Leg;

        Leg['price'] = price;
        Leg['currency'] = currency;

        if (outbound_refrences.length > 0 && inbound_refrences.length > 0) {
          if (outbound_refrences.includes(leg)) {
            outbound_flights.push(Leg);
          } else {
            inbound_flights.push(Leg);
          }
        } else {
          outbound_flights.push(Leg);
        }
      }
    }
  }

  if (
    (outbound_flights.length == 0 || inbound_flights.length == 0) &&
    options.legs.length == 2
  ) {
    return transformedResult;
  }

  for (const OutLeg of outbound_flights) {
    if (inbound_flights.length > 0) {
      inbound_flights.forEach(function (InLeg) {
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
              amount:
                (parseFloat(OutLeg.price) + parseFloat(InLeg.price)) *
                (options.adults + options.children),
              currency: OutLeg.currency
            }
          }
        ];
        if (transformedResult.itineraries[itinerary.id] != undefined) {
          if (
            transformedResult.itineraries[itinerary.id]['pricingOptions'][0][
              'price'
            ]['amount'] >
            itinerary['pricingOptions'][0]['price']['amount'] *
              (options.adults + options.children)
          ) {
            transformedResult.itineraries[itinerary.id] = itinerary;
          }
        } else {
          transformedResult.itineraries[itinerary.id] = itinerary;
        }
      });
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
            amount:
              parseFloat(OutLeg.price) * (options.adults + options.children),
            currency: OutLeg.currency
          }
        }
      ];

      if (transformedResult.itineraries[itinerary.id] != undefined) {
        if (
          transformedResult.itineraries[itinerary.id]['pricingOptions'][0][
            'price'
          ]['amount'] >
          OutLeg.price * (options.adults + options.children)
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

const generateDeepLink = (options: SearchOptions) => {
  if (options.tripType == 'oneway') {
    return `https://web.flypgs.com/booking?AFFILIATEID=TRAVOLIC&language=${options.language}&adultCount=${options.adults}&childCount=${options.children}&infantCount=${options.infants}&departurePort=${options.legs[0].origin}&arrivalPort=${options.legs[0].destination}&currency=${options.currency}&dateOption=1&departureDate=${options.legs[0].departure}`;
  } else {
    return `https://web.flypgs.com/booking?AFFILIATEID=TRAVOLIC&language=${options.language}&adultCount=${options.adults}&childCount=${options.children}&infantCount=${options.infants}&departurePort=${options.legs[0].origin}&arrivalPort=${options.legs[0].destination}&currency=${options.currency}&dateOption=1&departureDate=${options.legs[0].departure}&returnDate=${options.legs[1].departure}`;
  }
};

export default transformResults;
