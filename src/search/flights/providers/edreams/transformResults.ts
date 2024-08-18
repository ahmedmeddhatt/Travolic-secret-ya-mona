import moment from 'moment';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

const brandMapping: IDictionary<string> = {
  ED: 'eDreams',
  OP: 'Opodo',
  GO: 'GoVoyage',
  TL: 'TravelLink'
};
const providerName = 'edreams';
const transformResults = (
  options: SearchOptions,
  data: any
): TransformedResult => {
  const transformedResult: TransformedResult = {
    agents: {},
    legs: {},
    itineraries: {},
    segments: {},
    codeShare: {},
    flightDetails: data
  };

  if (Object.keys(data).length === 0 || !data['ns2:searchResponse'][0]) {
    transformedResult['error'] = 'No results found';
    return transformedResult;
  }

  data = data['ns2:searchResponse'][0].searchStatus[0];

  if (data.legend[0] === '') {
    transformedResult['error'] = 'No results found';
    return transformedResult;
  }

  const { currency } = data.preferences[0].$;

  const { sectionResults, segmentResults, baggageEstimationFees, locations } =
    data.legend[0];

  for (const result of data.itineraryResultsPages) {
    const agent: IDictionary<string> = {
      id: Buffer.from(brandMapping[result.$.brand]).toString('base64'),
      name: brandMapping[result.$.brand]
    };

    transformedResult.agents[agent.id] = agent;

    const deeplink = result.clickoutURL;

    for (const flight of result.itineraryResults) {
      const legIDs = [];
      const outboundSegmentIDs = flight.$.firstSegmentsIds.split(' ');

      legIDs.push(outboundSegmentIDs[0]);

      if (options.tripType === 'round') {
        const inboundSegmentIDs = flight.$.secondSegmentsIds.split(' ');
        legIDs.push(inboundSegmentIDs[0]);
      }

      const baggageID = flight.$.baggageFees;
      const price = flight.price[0].$.primePrice;
      const fullDeepLink = deeplink + flight.clickoutURLParams;

      const Legs: TransformedLeg[] = [];
      const baggage = baggageEstimationFees.find(
        (item) => item.$.id === baggageID
      );
      const totalBaggages = [];
      const BaggagesInKilos = [];

      let breakCheck = false;

      for (const legID of legIDs) {
        const Segments: TransformedSegment[] = [];
        const segmentObject = segmentResults.find(
          (segment) => segment.$.id === legID
        );
        const sectionIds = segmentObject.segment[0].$.sectionIds.split(' ');

        for (const sectionId of sectionIds) {
          const sectionObject = sectionResults.find(
            (section) => section.$.id === sectionId
          );
          const { section: sections } = sectionObject;

          for (const section of sections) {
            const {
              id: flightNumber,
              fromGeoNodeId,
              departureDate,
              toGeoNodeId,
              arrivalDate,
              carrierCode,
              operatingCarrierCode
            } = section.$;

            const origin = locations.find(
              (location) => location.$.geoNodeId === fromGeoNodeId
            );
            const destination = locations.find(
              (location) => location.$.geoNodeId === toGeoNodeId
            );

            const transFormedSegment: TransformedSegmentWithoutID = {
              origin: origin.$.iataCode,
              destination: destination.$.iataCode,
              departure: moment
                .utc(departureDate, 'YYYY-MM-DDTHH:mm:ss')
                .format('YYYYMMDDHHmm'),
              arrival: moment
                .utc(arrivalDate, 'YYYY-MM-DDTHH:mm:ss')
                .format('YYYYMMDDHHmm'),
              marketingCarrier: carrierCode,
              operatingCarrier: operatingCarrierCode || carrierCode,
              marketingFlightNumber: flightNumber,
              vehicleType: 'FLIGHT'
            };

            if (
              origin.$.type !== 'Airport' ||
              destination.$.type !== 'Airport'
            ) {
              breakCheck = true;
              break;
            }

            const segment = buildSegment(transFormedSegment);
            Segments.push(segment);

            if (operatingCarrierCode) {
              transformedResult.codeShare[`${carrierCode}${flightNumber}`] = {
                marketingCarrier: carrierCode,
                operatingCarrier:
                  operatingCarrierCode === ''
                    ? carrierCode
                    : operatingCarrierCode
              };
            }

            transformedResult.segments[segment.id] = segment;
          }

          if (breakCheck) {
            break;
          }
        }

        if (breakCheck) {
          break;
        }

        const Leg = buildLegFromSegments(Segments);

        Legs.push(Leg);
        transformedResult.legs[Leg.id] = Leg;
      }

      if (breakCheck) {
        continue;
      }

      const itinerary = buildItineraryFromLegs(Legs);

      totalBaggages.push(
        Number(
          baggage.baggageConditions[0].baggageDescriptorIncludedInPrice[0].$
            .pieces
        )
      );
      BaggagesInKilos.push(
        Number(
          baggage.baggageConditions[0].baggageDescriptorIncludedInPrice[0].$
            .kilos
        )
      );

      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: fullDeepLink
      });
      const priceOption = {
        agent: agent.id,
        agentName: agent.name,
        deepLink: deepLinkPayload,
        price: {
          amount: parseFloat(price),
          currency: currency
        },
        meta: {
          baggage: {
            totalBaggages: Math.max(...totalBaggages) || undefined,
            BaggagesInKilos: Math.max(...BaggagesInKilos) || undefined
          }
        }
      };

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

  return transformedResult;
};

export default transformResults;
