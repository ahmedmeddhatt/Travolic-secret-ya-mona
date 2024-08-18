import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';
import moment from 'moment';
import querystring from 'querystring';
import { supportedCurrencies } from './pos';

const providerName = 'lolTravel';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const cabinClassMap: IDictionary<string> = {
  Economy: 'ECONOMY',
  First: 'FIRST',
  Business: 'BUSINESS'
};

const transformResults = (options: SearchOptions, data: any) => {
  const transformedResult = {
    agents: {},
    legs: {},
    itineraries: {},
    segments: {},
    codeShare: {}
  };

  if (
    data == undefined ||
    !data.flightOptions ||
    data.flightOptions.length == 0 ||
    Object.keys(data).length < 1
  ) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  const flights = data.flightOptions;

  const exchangerValue =
    data.preferredCurrencyConversionRates[0].conversionRate;
  const currency = data.preferredCurrencyConversionRates[0].currencyCode;

  for (const trip of flights) {
    const price = trip.pricing.easyMarketTotalPrice.totalFare.amount;
    const segmentsBookingCodes = {};

    if (options.tripType === 'oneway') {
      const Legs: TransformedLeg[] = [];
      const Segments: TransformedSegment[] = [];
      const baggagesNums = [];
      const baggagesWeights = [];

      const { outboundFlights } = trip.flightGroup;

      const payload = {
        user: 'TRAVOLICLOLEN',
        commandName: 'doSearchAndPrice',
        tripType: 'oneway',
        outboundDate: moment
          .utc(options.legs[0].departure)
          .format('DD/MM/YYYY'),
        departureAirportCode: options.legs[0].origin,
        arrivalAirportCode: options.legs[0].destination,
        nrAdults: options.adults,
        nrChildren: options.children,
        nrInfants: options.infants,
        flightClass: cabinClassMap[options.cabinClass],
        priceQuoteKey: trip.pricing.priceQuoteKey,
        flightKey: outboundFlights[0].flightKey,
        currency: !supportedCurrencies.includes(options.currency)
          ? 'USD'
          : options.currency
      };

      for (const flightSegment of outboundFlights[0].flightSegments) {
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: flightSegment.depAirport.code,
          destination: flightSegment.arrAirport.code,
          departure: moment
            .utc(flightSegment.depDateTime)
            .format('YYYYMMDDHHmm'),
          arrival: moment.utc(flightSegment.arrDateTime).format('YYYYMMDDHHmm'),
          marketingCarrier: flightSegment.marketingAirline.code,
          operatingCarrier:
            flightSegment.operatingAirline === null
              ? flightSegment.marketingAirline.code
              : flightSegment.operatingAirline.code,
          marketingFlightNumber: flightSegment.flightNr,
          vehicleType: 'FLIGHT'
        };
        const segment = buildSegment(transFormedSegment);

        Segments.push(segment);
        segmentsBookingCodes[segment.id] = {
          bookingCode: flightSegment.bookingClass
        };

        if (flightSegment.operatingAirline !== null) {
          transformedResult.codeShare[
            `${flightSegment.marketingAirline.code}${flightSegment.flightNr}`
          ] = {
            marketingCarrier: flightSegment.marketingAirline.code,
            operatingCarrier: flightSegment.operatingAirline.code
          };
        }

        transformedResult.segments[segment.id] = segment;

        if (
          'travelersBaggageInfos' in flightSegment &&
          flightSegment['travelersBaggageInfos'] !== null
        ) {
          if (
            'forAdults' in flightSegment['travelersBaggageInfos'] &&
            flightSegment['travelersBaggageInfos']['forAdults'] !== null
          ) {
            const baggagesAmount =
              flightSegment.travelersBaggageInfos.forAdults.quantity;
            const baggagesWeight =
              flightSegment.travelersBaggageInfos.forAdults.weight;

            if (baggagesAmount !== 0 || baggagesAmount !== null) {
              baggagesNums.push(baggagesAmount);
            }

            if (baggagesWeight !== 0 || baggagesWeight !== null) {
              baggagesWeights.push(baggagesWeight);
            }
          }
        }
      }

      const Leg = buildLegFromSegments(Segments);

      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;

      const itinerary = buildItineraryFromLegs(Legs);
      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        termUrl: querystring.stringify(payload)
      });

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkPayload,
          price: {
            amount: price * exchangerValue,
            currency: currency
          },
          meta: {
            segments: segmentsBookingCodes
          }
        }
      ];

      const metaBaggage = {};
      if (baggagesNums.length > 0 || baggagesWeights.length > 0) {
        metaBaggage['totalBaggages'] =
          baggagesNums.length > 0 ? Math.max(...baggagesNums) : undefined;
        metaBaggage['BaggagesInKilos'] =
          baggagesWeights.length > 0 ? Math.max(...baggagesWeights) : undefined;
      }

      itinerary.pricingOptions[0].meta.baggage =
        Object.keys(metaBaggage).length > 0 ? metaBaggage : undefined;
      transformedResult.itineraries[itinerary.id] = itinerary;
    } else {
      const Legs: TransformedLeg[] = [];
      const OutSegments: TransformedSegment[] = [];
      const InSegments: TransformedSegment[] = [];
      const baggagesNums = [];
      const baggagesWeights = [];
      const { outboundFlights, inboundFlights } = trip.flightGroup;

      const payload = {
        user: 'TRAVOLICLOLEN',
        commandName: 'doSearchAndPrice',
        tripType: 'round',
        outboundDate: moment
          .utc(options.legs[0].departure)
          .format('DD/MM/YYYY'),
        inboundDate: moment.utc(options.legs[1].departure).format('DD/MM/YYYY'),
        departureAirportCode: options.legs[0].origin,
        arrivalAirportCode: options.legs[0].destination,
        nrAdults: options.adults,
        nrChildren: options.children,
        nrInfants: options.infants,
        flightClass: cabinClassMap[options.cabinClass],
        currency: !supportedCurrencies.includes(options.currency)
          ? 'USD'
          : options.currency,
        priceQuoteKey: trip.pricing.priceQuoteKey,
        flightKey: outboundFlights[0].flightKey
      };

      for (const flightSegment of outboundFlights[0].flightSegments) {
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: flightSegment.depAirport.code,
          destination: flightSegment.arrAirport.code,
          departure: moment
            .utc(flightSegment.depDateTime)
            .format('YYYYMMDDHHmm'),
          arrival: moment.utc(flightSegment.arrDateTime).format('YYYYMMDDHHmm'),
          marketingCarrier: flightSegment.marketingAirline.code,
          operatingCarrier:
            flightSegment.operatingAirline === null
              ? flightSegment.marketingAirline.code
              : flightSegment.operatingAirline.code,
          marketingFlightNumber: flightSegment.flightNr,
          vehicleType: 'FLIGHT'
        };
        const segment = buildSegment(transFormedSegment);

        segmentsBookingCodes[segment.id] = {
          bookingCode: flightSegment.bookingClass
        };

        if (flightSegment.operatingAirline !== null) {
          transformedResult.codeShare[
            `${flightSegment.marketingAirline.code}${flightSegment.flightNr}`
          ] = {
            marketingCarrier: flightSegment.marketingAirline.code,
            operatingCarrier: flightSegment.operatingAirline.code
          };
        }
        OutSegments.push(segment);
        transformedResult.segments[segment.id] = segment;

        if (
          'travelersBaggageInfos' in flightSegment &&
          flightSegment['travelersBaggageInfos'] !== null
        ) {
          if (
            'forAdults' in flightSegment['travelersBaggageInfos'] &&
            flightSegment['travelersBaggageInfos']['forAdults'] !== null
          ) {
            const baggagesAmount =
              flightSegment.travelersBaggageInfos.forAdults.quantity;
            const baggagesWeight =
              flightSegment.travelersBaggageInfos.forAdults.weight;

            if (baggagesAmount !== 0 || baggagesAmount !== null) {
              baggagesNums.push(baggagesAmount);
            }

            if (baggagesWeight !== 0 || baggagesWeight !== null) {
              baggagesWeights.push(baggagesWeight);
            }
          }
        }
      }

      const outboundLeg = buildLegFromSegments(OutSegments);

      Legs.push(outboundLeg);
      transformedResult.legs[outboundLeg.id] = outboundLeg;

      const flightkey = 'flightKey=' + inboundFlights[0].flightKey;

      for (const flightSegment of inboundFlights[0].flightSegments) {
        const transformedSegment: TransformedSegmentWithoutID = {
          origin: flightSegment.depAirport.code,
          destination: flightSegment.arrAirport.code,
          departure: moment
            .utc(flightSegment.depDateTime)
            .format('YYYYMMDDHHmm'),
          arrival: moment.utc(flightSegment.arrDateTime).format('YYYYMMDDHHmm'),
          marketingCarrier: flightSegment.marketingAirline.code,
          operatingCarrier:
            flightSegment.operatingAirline === null
              ? flightSegment.marketingAirline.code
              : flightSegment.operatingAirline.code,
          marketingFlightNumber: flightSegment.flightNr
        };
        const segment = buildSegment(transformedSegment);

        segmentsBookingCodes[segment.id] = {
          bookingCode: flightSegment.bookingClass
        };

        if (flightSegment.operatingAirline !== null) {
          transformedResult.codeShare[
            `${flightSegment.marketingAirline.code}${flightSegment.flightNr}`
          ] = {
            marketingCarrier: flightSegment.marketingAirline.code,
            operatingCarrier: flightSegment.operatingAirline.code
          };
        }
        InSegments.push(segment);
        transformedResult.segments[segment.id] = segment;

        if (
          'travelersBaggageInfos' in flightSegment &&
          flightSegment['travelersBaggageInfos'] !== null
        ) {
          if (
            'forAdults' in flightSegment['travelersBaggageInfos'] &&
            flightSegment['travelersBaggageInfos']['forAdults'] !== null
          ) {
            const baggagesAmount =
              flightSegment.travelersBaggageInfos.forAdults.quantity;
            const baggagesWeight =
              flightSegment.travelersBaggageInfos.forAdults.weight;

            if (baggagesAmount !== 0 || baggagesAmount !== null) {
              baggagesNums.push(baggagesAmount);
            }

            if (baggagesWeight !== 0 || baggagesWeight !== null) {
              baggagesWeights.push(baggagesWeight);
            }
          }
        }
      }

      const inboundLeg = buildLegFromSegments(InSegments);

      Legs.push(inboundLeg);
      transformedResult.legs[inboundLeg.id] = inboundLeg;

      const itinerary = buildItineraryFromLegs(Legs);
      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        termUrl: `${querystring.stringify(payload)}&${flightkey}`
      });

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkPayload,
          price: {
            amount: price * exchangerValue,
            currency: currency
          },
          meta: {
            segments: segmentsBookingCodes
          }
        }
      ];

      const metaBaggage = {};
      if (baggagesNums.length > 0 || baggagesWeights.length > 0) {
        metaBaggage['totalBaggages'] =
          baggagesNums.length > 0 ? Math.max(...baggagesNums) : undefined;
        metaBaggage['BaggagesInKilos'] =
          baggagesWeights.length > 0 ? Math.max(...baggagesWeights) : undefined;
      }

      itinerary.pricingOptions[0].meta.baggage =
        Object.keys(metaBaggage).length > 0 ? metaBaggage : undefined;
      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  }

  return transformedResult;
};

export default transformResults;
