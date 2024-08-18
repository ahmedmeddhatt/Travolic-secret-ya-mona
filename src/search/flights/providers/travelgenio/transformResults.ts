import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';
import moment from 'moment';
import querystring from 'querystring';

const providerName = 'Travelgenio';
const agent: IDictionary<string> = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const tripTypesMap: IDictionary<boolean> = {
  oneway: true,
  round: false
};

const cabinClassMap: IDictionary<string> = {
  Economy: 'Y',
  Premium_Economy: 'W',
  First: 'F',
  Business: 'C'
};

const partner_code = 'tr4V0c';

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
    data == null ||
    typeof data === 'undefined' ||
    data.Response.Options[0].Option[0].length === 0
  ) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  const supportedCountries = [
    'AE',
    'AU',
    'CA',
    'CZ',
    'GB',
    'ID',
    'IE',
    'IL',
    'IN',
    'KW',
    'MY',
    'NG',
    'NZ',
    'OM',
    'PH',
    'PK',
    'QA',
    'SA',
    'SG',
    'US',
    'ZA'
  ];

  if (!supportedCountries.includes(options.country)) {
    options.country = 'US';
  }

  const payload = {
    Brand: 'TG',
    Country: options.country,
    AD: options.adults,
    CH: options.children,
    INF: options.infants,
    Orig: options.legs[0].origin,
    Dest: options.legs[0].destination,
    DepDate: moment.utc(options.legs[0].departure).format('DD-MM-YYYY'),
    Class: cabinClassMap[options.cabinClass],
    Partner: partner_code + options.country,
    OW: tripTypesMap[options.tripType],
    ExtraData: true,
    DirectOnly: false,
    LowCost: true,
    IncludeOptionCode: true,
    Includecards: true,
    RetDate: undefined,
    OptionCode: undefined
  };

  if (!payload.OW) {
    payload.RetDate = moment
      .utc(options.legs[1].departure)
      .format('DD-MM-YYYY');
  }

  const trips = data.Response.Options[0].Option;

  for (const trip of trips) {
    const price = trip.TotalPrice[0];
    const discount = trip.DiscountPrice[0];
    const currency = trip.CurrID[0];
    const redirectUrl = trip.OptionCode[0];
    const Legs: TransformedLeg[] = [];
    const segmentsBookingCodes = {};
    const Segments: TransformedSegment[] = [];
    const totalBaggages = [];
    const BaggagesInKilos = [];

    for (const flight of trip.Segments[0].Segment) {
      const {
        Origin,
        Destination,
        DepDateTime,
        ArrDateTime,
        AirlineID,
        OperatingCarrier,
        FlightNum,
        Class,
        FreeBagUnitCode,
        FreeBagQuantity
      } = flight;
      const transFormedSegment: TransformedSegmentWithoutID = {
        origin: Origin[0],
        destination: Destination[0],
        departure: moment
          .utc(DepDateTime[0], 'YYYY-MM-DD HH:mm')
          .format('YYYYMMDDHHmm'),
        arrival: moment
          .utc(ArrDateTime[0], 'YYYY-MM-DD HH:mm')
          .format('YYYYMMDDHHmm'),
        marketingCarrier: AirlineID[0],
        operatingCarrier: OperatingCarrier[0],
        marketingFlightNumber: FlightNum[0],
        vehicleType: 'FLIGHT'
      };

      const segment = buildSegment(transFormedSegment);

      Segments.push(segment);
      segmentsBookingCodes[segment.id] = {
        bookingCode: Class[0]
      };
      transformedResult.codeShare[`${AirlineID[0]}${FlightNum[0]}`] = {
        marketingCarrier: AirlineID[0],
        operatingCarrier: OperatingCarrier[0]
      };

      if (FreeBagUnitCode[0] === 'N') {
        totalBaggages.push(Number(FreeBagQuantity[0]));
      } else {
        BaggagesInKilos.push(Number(FreeBagQuantity[0]));
      }

      transformedResult.segments[segment.id] = segment;
    }

    if (options.tripType === 'round') {
      if (trip.DepStops[0].length !== 0) {
        let initialTrips = trip.DepStops[0].split('|');
        initialTrips = initialTrips.slice(0, initialTrips.length - 1);
        const outBound = Segments.slice(0, initialTrips.length + 1);
        const inBound = Segments.slice(
          initialTrips.length + 1,
          Segments.length
        );

        let Leg = buildLegFromSegments(outBound);
        Legs.push(Leg);
        transformedResult.legs[Leg.id] = Leg;

        Leg = buildLegFromSegments(inBound);
        Legs.push(Leg);
        transformedResult.legs[Leg.id] = Leg;
      } else if (trip.RetStops[0].length !== null) {
        const outBound = Segments.slice(0, 1);
        let Leg = buildLegFromSegments(outBound);
        Legs.push(Leg);
        transformedResult.legs[Leg.id] = Leg;

        const inBound = Segments.slice(1, Segments.length);
        Leg = buildLegFromSegments(inBound);
        Legs.push(Leg);
        transformedResult.legs[Leg.id] = Leg;
      } else {
        const outBound = Segments.slice(0, 1);
        const inBound = Segments.slice(1, 2);
        let Leg = buildLegFromSegments(outBound);
        Legs.push(Leg);
        transformedResult.legs[Leg.id] = Leg;
        Leg = buildLegFromSegments(inBound);
        Legs.push(Leg);
        transformedResult.legs[Leg.id] = Leg;
      }
    } else {
      const Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
    }

    payload.OptionCode = redirectUrl;

    const itinerary = buildItineraryFromLegs(Legs);
    const deepLinkPayload = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url:
        'http://dl.travelgenio.com/Results.aspx?' +
        querystring.stringify(payload)
    });

    itinerary.pricingOptions = [
      {
        agent: agent.id,
        agentName: agent.name,
        deepLink: deepLinkPayload,
        price: {
          amount: parseFloat(price),
          currency: currency,
          discount: parseFloat(discount)
        },
        meta: {
          baggage: {
            totalBaggages:
              totalBaggages.length > 0 ? Math.max(...totalBaggages) : undefined,
            BaggagesInKilos:
              BaggagesInKilos.length > 0
                ? Math.max(...BaggagesInKilos)
                : undefined
          },
          segments: segmentsBookingCodes
        }
      }
    ];
    transformedResult.itineraries[itinerary.id] = itinerary;
  }

  return transformedResult;
};

export default transformResults;
