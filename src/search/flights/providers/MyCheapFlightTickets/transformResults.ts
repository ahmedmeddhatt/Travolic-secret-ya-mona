import moment from 'moment';
import {
  buildLegFromSegments,
  buildSegment,
  buildItineraryFromLegs,
  encodeRedirectPayload
} from '../../../../utils';
const providerName = 'MyCheapFlightTickets';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const filterSegemtData = (flight: any) => {
  const departureDate = `${flight.DepartureDate._}T${flight.DepartureTime._}`;
  const arrivalDate = `${flight.ArrivalDate._}T${flight.ArrivalTime._}`;
  const transFormedSegment: TransformedSegmentWithoutID = {
    origin: flight.DepartureAirportCode._,
    destination: flight.DestinationAirportCode._,
    departure: moment
      .utc(departureDate, 'YYYY-MM-DDTHH:mm')
      .format('YYYYMMDDHHmm'),
    arrival: moment.utc(arrivalDate, 'YYYY-MM-DDTHH:mm').format('YYYYMMDDHHmm'),
    marketingCarrier: flight.AirlineCode._,
    operatingCarrier: flight.CodeshareAirlineCode
      ? flight.CodeshareAirlineCode._
      : flight.AirlineCode._,
    marketingFlightNumber: flight.FlightNumber._,
    vehicleType: 'FLIGHT'
  };

  return transFormedSegment;
};

const transformResults = (
  input: SearchOptions,
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
    !data ||
    !data['FlightSearchRsp'] ||
    Object.keys(data['FlightSearchRsp']).length === 0 ||
    !data['FlightSearchRsp']['Flight'] ||
    data['FlightSearchRsp']['Flight'].length === 0
  ) {
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  let passengersDataType;
  if (input.adults > 0 && (input.children > 0 || input.infants > 0)) {
    passengersDataType = 'array';
  } else {
    passengersDataType = 'object';
  }
  const flights = data.FlightSearchRsp.Flight;
  const currency = data.FlightSearchRsp.$.Currency;

  for (const flight of flights) {
    const url = flight.DeepLink._;
    let price = 0;
    const outboundObj = flight.OutboundLegs;
    const outboundLeg = outboundObj.Leg;
    const outboundLegIsArr = Array.isArray(outboundLeg);
    const outboundPassengers =
      outboundObj.PriceDetails.PriceBreakdown.Passenger;
    const baggageAllowaneCount = [];

    if (passengersDataType === 'array') {
      for (const passenger of outboundPassengers) {
        const passengerPrice =
          passenger.TotalPriceBeforeDiscount._ * passenger.Quantity._;
        price += passengerPrice;
      }
    } else if (passengersDataType === 'object') {
      const passengerPrice =
        outboundPassengers.TotalPriceBeforeDiscount._ *
        outboundPassengers.Quantity._;
      price += passengerPrice;
    }

    let Segments: TransformedSegment[] = [];
    const Legs: TransformedLeg[] = [];

    if (outboundLegIsArr) {
      for (const seg of outboundLeg) {
        const transFormedSegment: TransformedSegmentWithoutID =
          filterSegemtData(seg);
        const Segemnt = buildSegment(transFormedSegment);
        Segments.push(Segemnt);
        transformedResult.segments[Segemnt.id] = Segemnt;
        transformedResult.codeShare[
          `${seg.AirlineCode._}${seg.FlightNumber._}`
        ] = {
          marketingCarrier: seg.AirlineCode._,
          operatingCarrier: seg.CodeshareAirlineCode
            ? seg.CodeshareAirlineCode._
            : seg.AirlineCode._
        };
        if (seg.BaggageAllowance && seg.BaggageAllowance.Bag) {
          const baggageAllowanceBag = seg.BaggageAllowance.Bag;

          if (
            baggageAllowanceBag.$ &&
            Object.keys(baggageAllowanceBag.$).length > 0 &&
            baggageAllowanceBag.$.PaxType === 'adult' &&
            baggageAllowanceBag.$.Type === 'number'
          ) {
            baggageAllowaneCount.push(baggageAllowanceBag._);
          }
        }
      }
    } else {
      const transFormedSegment: TransformedSegmentWithoutID =
        filterSegemtData(outboundLeg);
      const Segemnt = buildSegment(transFormedSegment);
      Segments.push(Segemnt);
      transformedResult.segments[Segemnt.id] = Segemnt;
      transformedResult.codeShare[
        `${outboundLeg.AirlineCode._}${outboundLeg.FlightNumber._}`
      ] = {
        marketingCarrier: outboundLeg.AirlineCode._,
        operatingCarrier: outboundLeg.CodeshareAirlineCode
          ? outboundLeg.CodeshareAirlineCode._
          : outboundLeg.AirlineCode._
      };
      if (outboundLeg.BaggageAllowance && outboundLeg.BaggageAllowance.Bag) {
        const baggageAllowanceBag = outboundLeg.BaggageAllowance.Bag;

        if (
          baggageAllowanceBag.$ &&
          Object.keys(baggageAllowanceBag.$).length > 0 &&
          baggageAllowanceBag.$.PaxType === 'adult' &&
          baggageAllowanceBag.$.Type === 'number'
        ) {
          baggageAllowaneCount.push(baggageAllowanceBag._);
        }
      }
    }
    let Leg = buildLegFromSegments(Segments);
    Legs.push(Leg);
    transformedResult.legs[Leg.id] = Leg;
    Segments = [];

    if (input.tripType === 'round') {
      const inboundObj = flight.InboundLegs;
      const inboundLeg = inboundObj.Leg;
      const inboundLegIsArr = Array.isArray(inboundLeg);
      const inboundPassengers =
        inboundObj.PriceDetails.PriceBreakdown.Passenger;

      if (passengersDataType === 'array') {
        for (const passenger of inboundPassengers) {
          const passengerPrice =
            passenger.TotalPriceBeforeDiscount._ * passenger.Quantity._;
          price += passengerPrice;
        }
      } else if (passengersDataType === 'object') {
        const passengerPrice =
          inboundPassengers.TotalPriceBeforeDiscount._ *
          inboundPassengers.Quantity._;
        price += passengerPrice;
      }

      if (inboundLegIsArr) {
        for (const seg of inboundLeg) {
          const transFormedSegment: TransformedSegmentWithoutID =
            filterSegemtData(seg);
          const Segemnt = buildSegment(transFormedSegment);
          Segments.push(Segemnt);
          transformedResult.segments[Segemnt.id] = Segemnt;
          transformedResult.codeShare[
            `${seg.AirlineCode._}${seg.FlightNumber._}`
          ] = {
            marketingCarrier: seg.AirlineCode._,
            operatingCarrier: seg.CodeshareAirlineCode
              ? seg.CodeshareAirlineCode._
              : seg.AirlineCode._
          };
          if (seg.BaggageAllowance && seg.BaggageAllowance.Bag) {
            const baggageAllowanceBag = seg.BaggageAllowance.Bag;
            if (
              baggageAllowanceBag.$ &&
              Object.keys(baggageAllowanceBag.$).length > 0 &&
              baggageAllowanceBag.$.PaxType === 'adult' &&
              baggageAllowanceBag.$.Type === 'number'
            ) {
              baggageAllowaneCount.push(baggageAllowanceBag._);
            }
          }
        }
      } else {
        const transFormedSegment: TransformedSegmentWithoutID =
          filterSegemtData(inboundLeg);
        const Segemnt = buildSegment(transFormedSegment);
        Segments.push(Segemnt);
        transformedResult.segments[Segemnt.id] = Segemnt;
        transformedResult.codeShare[
          `${inboundLeg.AirlineCode._}${inboundLeg.FlightNumber._}`
        ] = {
          marketingCarrier: inboundLeg.AirlineCode._,
          operatingCarrier: inboundLeg.CodeshareAirlineCode
            ? inboundLeg.CodeshareAirlineCode._
            : inboundLeg.AirlineCode._
        };
        if (inboundLeg.BaggageAllowance && inboundLeg.BaggageAllowance.Bag) {
          const baggageAllowanceBag = inboundLeg.BaggageAllowance.Bag;
          if (
            baggageAllowanceBag.$ &&
            Object.keys(baggageAllowanceBag.$).length > 0 &&
            baggageAllowanceBag.$.PaxType === 'adult' &&
            baggageAllowanceBag.$.Type === 'number'
          ) {
            baggageAllowaneCount.push(baggageAllowanceBag._);
          }
        }
      }
      Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
    }
    const itinerary = buildItineraryFromLegs(Legs);
    const encodedDeepLink = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url
    });

    let meta = {};
    if (
      baggageAllowaneCount.length > 0 &&
      Math.max(...baggageAllowaneCount) > 0
    ) {
      meta = {
        baggage: {
          totalBaggages: Math.max(...baggageAllowaneCount)
        }
      };
    }

    itinerary.pricingOptions = [
      {
        agent: agent.id,
        agentName: agent.name,
        deepLink: encodedDeepLink,
        price: {
          amount: price,
          currency
        },
        meta: Object.keys(meta).length > 0 ? meta : undefined
      }
    ];

    transformedResult.itineraries[itinerary.id] = itinerary;
  }

  return transformedResult;
};

export default transformResults;
