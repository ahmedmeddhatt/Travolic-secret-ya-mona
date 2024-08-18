import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';
import moment from 'moment';

const providerName = 'etravlie';
const cabinClassMap: IDictionary<string> = {
  Economy: 'Y',
  Premium_Economy: 'S',
  First: 'F',
  Business: 'C'
};

const transformResults = (
  options: SearchOptions,
  results: any
): TransformedResult => {
  const transformedResult: TransformedResult = {
    agents: {},
    legs: {},
    itineraries: {},
    segments: {},
    codeShare: {},
    flightDetails: results
  };

  for (const data of results) {
    if (Object.keys(data).length === 0) continue;
    if (data.offers === undefined) continue;

    const agent: IDictionary<string> = {
      id: Buffer.from(data.brand).toString('base64'),
      name: data.brand
    };

    transformedResult.agents[agent.id] = agent;

    const currency = data.offers.currency.code;

    for (const offer of data.offers.offer) {
      const Legs: TransformedLeg[] = [];
      const { price, url: redirectUrl } = offer;
      let Segments: TransformedSegment[] = [];
      const totalBaggages = [];
      const BaggagesInKilos = [];
      const totalHandbages = [];
      const HandbagesInKilos = [];
      let flag = true;

      for (const bound of offer.bound) {
        for (const flight of bound.segment) {
          const {
            from,
            to,
            marketingCarrier,
            operatingCarrier,
            flight: flightNumber,
            cabin,
            equipment
          } = flight;

          if (cabinClassMap[options.cabinClass] !== cabin) {
            flag = false;
            break;
          }

          const transFormedSegment: TransformedSegmentWithoutID = {
            origin: from.iata,
            destination: to.iata,
            departure: moment
              .utc(`${from.date} ${from.time}`, 'YYYY-MM-DD HH:mm')
              .format('YYYYMMDDHHmm'),
            arrival: moment
              .utc(`${to.date} ${to.time}`, 'YYYY-MM-DD HH:mm')
              .format('YYYYMMDDHHmm'),
            marketingCarrier: marketingCarrier,
            operatingCarrier: operatingCarrier || marketingCarrier,
            marketingFlightNumber: flightNumber,
            vehicleType: 'FLIGHT',
            aircraft: equipment
          };
          const segment = buildSegment(transFormedSegment);

          Segments.push(segment);
          transformedResult.codeShare[`${marketingCarrier}${flightNumber}`] = {
            marketingCarrier,
            operatingCarrier: operatingCarrier
              ? operatingCarrier
              : marketingCarrier,
            aircraftType: equipment
          };
          transformedResult.segments[segment.id] = segment;
        }

        if (!flag) break;

        const Leg = buildLegFromSegments(Segments);
        Legs.push(Leg);
        transformedResult.legs[Leg.id] = Leg;

        Segments = [];
      }

      if (!flag) continue;

      const itinerary = buildItineraryFromLegs(Legs);

      if (offer.freeCabinBaggage) {
        if (offer.freeCabinBaggage.cabinBaggageRestrictions.pieces) {
          totalHandbages.push(
            Number(offer.freeCabinBaggage.cabinBaggageRestrictions.pieces)
          );
        }
        if (offer.freeCabinBaggage.cabinBaggageRestrictions.maxWeight) {
          HandbagesInKilos.push(
            Number(offer.freeCabinBaggage.cabinBaggageRestrictions.maxWeight)
          );
        }
      }

      if (offer.freeBaggage) {
        const baggageAmount = Number(offer.freeBaggage.amount);
        if (offer.freeBaggage.type === 'P') {
          totalBaggages.push(baggageAmount);
        } else if (offer.freeBaggage.type === 'W') {
          let weightInKilos = 0;
          if (
            (offer.freeBaggage.unit && offer.freeBaggage.unit !== null) ||
            offer.freeBaggage.unit !== ''
          ) {
            if (offer.freeBaggage.unit === 'K') {
              weightInKilos = baggageAmount;
            } else if (offer.freeBaggage.unit === 'P') {
              weightInKilos = Math.round(baggageAmount / 2.20462);
            }
          } else {
            weightInKilos = baggageAmount;
          }

          BaggagesInKilos.push(weightInKilos);
        }
      }

      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: redirectUrl
      });

      const priceOption = {
        agent: agent.id,
        agentName: agent.name,
        deepLink: deepLinkPayload,
        price: {
          amount: parseFloat(price),
          currency: currency
        }
      };

      if (
        totalHandbages.length !== 0 ||
        HandbagesInKilos.length !== 0 ||
        BaggagesInKilos.length !== 0 ||
        totalBaggages.length !== 0
      ) {
        priceOption['meta'] = {
          baggage: {
            totalHandbages: totalHandbages.length
              ? totalHandbages[0]
              : undefined,
            HandbagesInKilos: HandbagesInKilos.length
              ? HandbagesInKilos[0]
              : undefined,
            BaggagesInKilos: BaggagesInKilos.length
              ? BaggagesInKilos[0]
              : undefined,
            totalBaggages: totalBaggages.length ? totalBaggages[0] : undefined
          }
        };
      }

      if (transformedResult.itineraries[itinerary.id]) {
        const options =
          transformedResult.itineraries[itinerary.id].pricingOptions;
        let found = false;

        for (const option of options) {
          if (
            option.price.amount >= priceOption.price.amount &&
            option.agent === priceOption.agent
          ) {
            transformedResult.itineraries[itinerary.id].pricingOptions.splice(
              transformedResult.itineraries[
                itinerary.id
              ].pricingOptions.indexOf(option),
              1
            );
            break;
          } else if (
            option.price.amount < priceOption.price.amount &&
            option.agent === priceOption.agent
          ) {
            found = true;
            break;
          }
        }

        if (!found) {
          transformedResult.itineraries[itinerary.id].pricingOptions.push(
            priceOption
          );
        }
      } else {
        itinerary.pricingOptions = [priceOption];
        transformedResult.itineraries[itinerary.id] = itinerary;
      }
    }
  }

  if (Object.keys(transformedResult.itineraries).length === 0) {
    transformedResult['error'] = 'No data found.';
  }
  return transformedResult;
};

export default transformResults;
