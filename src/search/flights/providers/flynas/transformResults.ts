import moment from 'moment';
import {
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs,
  encodeRedirectPayload
} from '../../../../utils';

const providerName = 'flynas';
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

  if (Object.keys(data).length === 0) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  data = data['s:Envelope']['s:Body'];

  if (
    data.length === 0 ||
    data[0].GetLowFareTripAvailabilityResponse.length === 0 ||
    data[0].GetLowFareTripAvailabilityResponse[0]
      .LowFareTripAvailabilityResponse.length === 0
  ) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  const trips =
    data[0].GetLowFareTripAvailabilityResponse[0]
      .LowFareTripAvailabilityResponse[0].LowFareAvailabilityResponseList[0]
      .LowFareAvailabilityResponse;

  if (options.tripType === 'oneway') {
    for (const trip of trips) {
      const flightSegments =
        trip.DateMarketLowFareList[0].DateMarketLowFare[0]
          .DateFlightLowFareList[0].DateFlightLowFare;
      const currency =
        trip.DateMarketLowFareList[0].DateMarketLowFare[0].CurrencyCode[0];

      for (const flightSegment of flightSegments) {
        const { DateFlightLegList, FareAmount, TaxesAndFeesAmount, STD, STA } =
          flightSegment;
        const Legs: TransformedLeg[] = [];
        const Segments: TransformedSegment[] = [];
        const flights = DateFlightLegList[0].DateFlightLeg;
        const price =
          parseFloat(FareAmount[0]) + parseFloat(TaxesAndFeesAmount[0]);

        if (price === 0) continue;

        for (const flight of flights) {
          const {
            DepartureStation,
            ArrivalStation,
            CarrierCode,
            OperatingCarrier,
            FlightNumber
          } = flight;
          const transFormedSegment: TransformedSegmentWithoutID = {
            origin: DepartureStation[0],
            destination: ArrivalStation[0],
            departure: moment.utc(STD[0]).format('YYYYMMDDHHmm'),
            arrival: moment.utc(STA[0]).format('YYYYMMDDHHmm'),
            marketingCarrier: CarrierCode[0],
            operatingCarrier: OperatingCarrier[0] || CarrierCode[0],
            marketingFlightNumber: FlightNumber[0].trim(),
            vehicleType: 'FLIGHT'
          };

          const segment = buildSegment(transFormedSegment);

          Segments.push(segment);
          transformedResult.segments[segment.id] = segment;
        }

        const Leg = buildLegFromSegments(Segments);

        Legs.push(Leg);
        transformedResult.legs[Leg.id] = Leg;

        const itinerary = buildItineraryFromLegs(Legs);
        const encodedPayload = encodeRedirectPayload({
          provider: providerName,
          agentId: agent.id,
          agentName: agent.name,
          url: generateDeepLink(options)
        });

        itinerary.pricingOptions = [
          {
            agent: agent.id,
            agentName: agent.name,
            deepLink: encodedPayload,
            price: {
              amount: price * (options.adults + options.children),
              currency: currency
            }
          }
        ];

        transformedResult.itineraries[itinerary.id] = itinerary;
      }
    }
  } else {
    const inbound_flights = [];
    const outbound_flights = [];
    trips.forEach((trip, index) => {
      const flightSegments =
        trip.DateMarketLowFareList[0].DateMarketLowFare[0]
          .DateFlightLowFareList[0].DateFlightLowFare;
      const currency =
        trip.DateMarketLowFareList[0].DateMarketLowFare[0].CurrencyCode[0];
      const Legs: TransformedLeg[] = [];

      for (const flightSegment of flightSegments) {
        const { DateFlightLegList, FareAmount, TaxesAndFeesAmount, STD, STA } =
          flightSegment;
        const flights = DateFlightLegList[0].DateFlightLeg;
        const price =
          parseFloat(FareAmount[0]) + parseFloat(TaxesAndFeesAmount[0]);
        const Segments: TransformedSegment[] = [];

        if (price === 0) continue;

        for (const flight of flights) {
          const {
            DepartureStation,
            ArrivalStation,
            CarrierCode,
            OperatingCarrier,
            FlightNumber
          } = flight;

          const transFormedSegment: TransformedSegmentWithoutID = {
            origin: DepartureStation[0],
            destination: ArrivalStation[0],
            departure: moment.utc(STD[0]).format('YYYYMMDDHHmm'),
            arrival: moment.utc(STA[0]).format('YYYYMMDDHHmm'),
            marketingCarrier: CarrierCode[0],
            operatingCarrier: OperatingCarrier[0] || CarrierCode[0],
            marketingFlightNumber: FlightNumber[0].trim(),
            vehicleType: 'FLIGHT'
          };
          const segment = buildSegment(transFormedSegment);

          Segments.push(segment);
          transformedResult.segments[segment.id] = segment;
        }

        if (index === 0) {
          const Leg = buildLegFromSegments(Segments);

          Leg['price'] = price;
          Leg['currency'] = currency;
          Legs.push(Leg);
          outbound_flights.push(Leg);
          transformedResult.legs[Leg.id] = Leg;
        } else {
          const Leg = buildLegFromSegments(Segments);

          Leg['price'] = price;
          Leg['currency'] = currency;
          Legs.push(Leg);
          inbound_flights.push(Leg);
          transformedResult.legs[Leg.id] = Leg;
        }
      }
    });

    for (const outbound_flight of outbound_flights) {
      for (const inbound_flight of inbound_flights) {
        const Legs: TransformedLeg[] = [outbound_flight, inbound_flight];

        const itinerary = buildItineraryFromLegs(Legs);
        const encodedPayload = encodeRedirectPayload({
          provider: providerName,
          agentId: agent.id,
          agentName: agent.name,
          url: generateDeepLink(options)
        });

        itinerary.pricingOptions = [
          {
            agent: agent.id,
            agentName: agent.name,
            deepLink: encodedPayload,
            price: {
              amount:
                outbound_flight['price'] * (options.adults + options.children) +
                inbound_flight['price'] * (options.adults + options.children),
              currency: outbound_flight['currency']
            }
          }
        ];
        transformedResult.itineraries[itinerary.id] = itinerary;
      }
    }
  }

  if (Object.keys(transformedResult.itineraries).length === 0) {
    transformedResult.agents = {};
    transformedResult.error = 'No data found.';
  }

  return transformedResult;
};

const generateDeepLink = (options: SearchOptions) => {
  if (options.tripType === 'oneway') {
    return `https://booking.flynas.com/#/booking/search-redirect?origin=${
      options.legs[0].origin
    }&destination=${
      options.legs[0].destination
    }&origin1=&destination1=&currency=SAR&departureDate=${moment
      .utc(options.legs[0].departure)
      .format('MM/DD/YYYY')}&returnDate=&flightMode=oneway&adultCount=${
      options.adults
    }&childCount=${options.children}&infantCount=${
      options.infants
    }&promoCode=&culture=en-US&reference=API064TVLC`;
  } else {
    return `https://booking.flynas.com/#/booking/search-redirect?origin=${
      options.legs[0].origin
    }&destination=${options.legs[0].destination}&origin1=${
      options.legs[1].origin
    }&destination1=${
      options.legs[1].destination
    }&currency=SAR&departureDate=${moment
      .utc(options.legs[0].departure)
      .format('MM/DD/YYYY')}&returnDate=${moment
      .utc(options.legs[1].departure)
      .format('MM/DD/YYYY')}&flightMode=round&adultCount=${
      options.adults
    }&childCount=${options.children}&infantCount=${
      options.infants
    }&promoCode=&culture=en-US&reference=API064TVLC`;
  }
};

export default transformResults;
