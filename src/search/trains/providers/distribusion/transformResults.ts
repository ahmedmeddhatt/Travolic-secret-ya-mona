import moment from 'moment';

import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';
import querystring from 'querystring';

const transformResults = async (
  options: SearchTrainOptions,
  transformedData: any
): Promise<TransformedTrainResult> => {
  const { data, stations, carriers, dumpStations, dumpCarriers } =
    transformedData;

  const transformedResult: TransformedTrainResult = {
    agents: {},
    legs: {},
    outboundItineraries: {},
    inboundItineraries: {},
    segments: {},
    amenities: {},
    stations: stations,
    carriers: carriers
  };

  if (Object.keys(data).length === 0 || data.errors || data.data.length === 0) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  const dataSegments = data.included.filter(
    (item: any) => item.type === 'segments'
  );
  const dataStations = data.included.filter(
    (item: any) => item.type === 'stations'
  );
  const dataFareClasses = data.included.filter(
    (item: any) => item.type === 'fare_classes'
  );
  const dataFareFeatures = data.included.filter(
    (item: any) => item.type === 'fare_features'
  );
  const stationsMap = dataStations.reduce((acc: any, item: any) => {
    acc[item.id] = item;
    return acc;
  }, {});
  const segmentsMap = dataSegments.reduce((acc: any, item: any) => {
    acc[item.id] = item;
    return acc;
  }, {});
  const fareClassesMap = dataFareClasses.reduce((acc: any, item: any) => {
    acc[item.id] = item;
    return acc;
  }, {});
  const fareFeaturesMap = dataFareFeatures.reduce((acc: any, item: any) => {
    acc[item.id] = item;
    return acc;
  }, {});

  const outboundLegs = data.data.filter((item: any) => {
    return (
      moment(item.attributes.departure_time).format('YYYY-MM-DD') ===
      moment(options.legs[0].departure).format('YYYY-MM-DD')
    );
  });

  if (options.tripType === 'oneway') {
    for (const outboundLeg of outboundLegs) {
      const segments = outboundLeg.relationships.segments.data;
      const fares = outboundLeg.relationships.fares.data;
      const Segments: TransformedSegment[] = [];

      fares.sort((a, b) =>
        a.price < b.price ? -1 : a.price > b.price ? 1 : 0
      );

      for (let segment of segments) {
        segment = segmentsMap[segment.id];

        const origin =
          dumpStations[
            stationsMap[segment.relationships.departure_station.data.id]
              .attributes.code
          ];
        const destination =
          dumpStations[
            stationsMap[segment.relationships.arrival_station.data.id]
              .attributes.code
          ];
        const marketingCarrier =
          dumpCarriers[segment.relationships.marketing_carrier.data.id];
        const operatingCarrier =
          dumpCarriers[
            segment.relationships.operating_carrier.data.id ||
              segment.relationships.marketing_carrier.data.id
          ];

        const segmentObject = buildSegment({
          origin: origin,
          destination: destination,
          departure: moment(segment.attributes.departure_time).format(
            'YYYYMMDDHHmm'
          ),
          arrival: moment(segment.attributes.arrival_time).format(
            'YYYYMMDDHHmm'
          ),
          marketingCarrier: marketingCarrier,
          operatingCarrier: operatingCarrier,
          vehicleType: segment.relationships.vehicle.data.id.split('-')[0]
        });

        const amenities =
          fareClassesMap[fares[0].fare_class.id].relationships.fare_features
            .data;

        for (const amenity of amenities) {
          const amenityObj = fareFeaturesMap[amenity.id];

          if (!transformedResult.amenities[segmentObject.id]) {
            transformedResult.amenities[segmentObject.id] = [
              {
                id: amenityObj.id,
                name: amenityObj.attributes.name,
                description: amenityObj.attributes.description
              }
            ];
          } else {
            transformedResult.amenities[segmentObject.id].push({
              id: amenityObj.id,
              name: amenityObj.attributes.name,
              description: amenityObj.attributes.description
            });
          }
        }

        transformedResult.segments[segmentObject.id] = segmentObject;
        Segments.push(segmentObject);
      }

      const Leg = buildLegFromSegments(Segments);

      const price =
        options.currency === 'JPY' || options.currency === 'KRW'
          ? fares[0].price
          : fares[0].price / 100;

      transformedResult.legs[Leg.id] = Leg;

      const carrier =
        dumpCarriers[outboundLeg.relationships.marketing_carrier.data.id];

      const agent: IDictionary<string> = {
        id: Buffer.from(carrier).toString('base64'),
        ...carriers[carrier]
      };

      transformedResult.agents[agent.id] = agent;

      const itinerary = buildItineraryFromLegs([Leg]);

      const deepLinkPayload = encodeRedirectPayload({
        provider: 'distribusion',
        agentId: agent.id,
        agentName: agent.name,
        outboundPayload: querystring.stringify({
          marketing_carrier_code: outboundLeg.id.split('-')[0],
          departure_time: outboundLeg.attributes.departure_time,
          arrival_time: outboundLeg.attributes.arrival_time,
          origin: outboundLeg.id.split('-')[1],
          destination: outboundLeg.id.split('-')[2],
          fare_class: outboundLeg.attributes.cheapest_fare_class_code
        })
      });

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkPayload,
          price: {
            amount: parseFloat(price),
            currency: data.meta.currency
          }
        }
      ];

      transformedResult.outboundItineraries[itinerary.id] = itinerary;
    }
  } else if (options.tripType === 'round') {
    const inboundLegs = data.data.filter((item: any) => {
      return (
        moment(item.attributes.arrival_time).format('YYYY-MM-DD') ===
        moment(options.legs[1].departure).format('YYYY-MM-DD')
      );
    });

    for (const inboundLeg of inboundLegs) {
      const segments = inboundLeg.relationships.segments.data;
      const fares = inboundLeg.relationships.fares.data;
      const Segments: TransformedSegment[] = [];

      fares.sort((a, b) =>
        a.price < b.price ? -1 : a.price > b.price ? 1 : 0
      );

      for (let segment of segments) {
        segment = segmentsMap[segment.id];

        const origin =
          dumpStations[
            stationsMap[segment.relationships.departure_station.data.id]
              .attributes.code
          ];
        const destination =
          dumpStations[
            stationsMap[segment.relationships.arrival_station.data.id]
              .attributes.code
          ];
        const marketingCarrier =
          dumpCarriers[segment.relationships.marketing_carrier.data.id];
        const operatingCarrier =
          dumpCarriers[
            segment.relationships.operating_carrier.data.id ||
              segment.relationships.marketing_carrier.data.id
          ];
        const segmentObject = buildSegment({
          origin: origin,
          destination: destination,
          departure: moment(segment.attributes.departure_time).format(
            'YYYYMMDDHHmm'
          ),
          arrival: moment(segment.attributes.arrival_time).format(
            'YYYYMMDDHHmm'
          ),
          marketingCarrier: marketingCarrier,
          operatingCarrier: operatingCarrier,
          vehicleType: segment.relationships.vehicle.data.id.split('-')[0]
        });

        const amenities =
          fareClassesMap[fares[0].fare_class.id].relationships.fare_features
            .data;

        for (const amenity of amenities) {
          const amenityObj = data.included.find(
            (item: any) =>
              item.type === 'fare_features' && item.id === amenity.id
          );

          if (!transformedResult.amenities[segmentObject.id]) {
            transformedResult.amenities[segmentObject.id] = [
              {
                id: amenityObj.id,
                name: amenityObj.attributes.name,
                description: amenityObj.attributes.description
              }
            ];
          } else {
            transformedResult.amenities[segmentObject.id].push({
              id: amenityObj.id,
              name: amenityObj.attributes.name,
              description: amenityObj.attributes.description
            });
          }
        }
        transformedResult.segments[segmentObject.id] = segmentObject;
        Segments.push(segmentObject);
      }

      const leg = buildLegFromSegments(Segments);

      let inboundPrice =
        options.currency === 'JPY' || options.currency === 'KRW'
          ? fares[0].price
          : fares[0].price / 100;

      inboundPrice = parseFloat(inboundPrice.toFixed(2));

      transformedResult.legs[leg.id] = leg;

      const inboundItinerary = buildItineraryFromLegs([leg]);

      const carrier =
        dumpCarriers[inboundLeg.relationships.marketing_carrier.data.id];

      const agent: IDictionary<string> = {
        id: Buffer.from(carrier).toString('base64'),
        ...carriers[carrier]
      };

      transformedResult.agents[agent.id] = agent;

      const deepLinkPayload = encodeRedirectPayload({
        provider: 'distribusion',
        agentId: agent.id,
        agentName: agent.name,
        inboundPayload: querystring.stringify({
          return_departure_time: inboundLeg.attributes.departure_time,
          return_arrival_time: inboundLeg.attributes.arrival_time
        })
      });

      inboundItinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkPayload,
          price: {
            amount: inboundPrice,
            currency: data.meta.currency
          }
        }
      ];
      inboundItinerary.origin = leg.origin;
      inboundItinerary.destination = leg.destination;

      transformedResult.inboundItineraries[inboundItinerary.id] =
        inboundItinerary;
    }

    const inboundItinerariesArray = Object.values(
      transformedResult.inboundItineraries
    );

    for (const outboundLeg of outboundLegs) {
      const segments = outboundLeg.relationships.segments.data;
      const fares = outboundLeg.relationships.fares.data;
      const Segments: TransformedSegment[] = [];

      fares.sort((a, b) =>
        a.price < b.price ? -1 : a.price > b.price ? 1 : 0
      );

      for (let segment of segments) {
        segment = segmentsMap[segment.id];

        const origin =
          dumpStations[
            stationsMap[segment.relationships.departure_station.data.id]
              .attributes.code
          ];
        const destination =
          dumpStations[
            stationsMap[segment.relationships.arrival_station.data.id]
              .attributes.code
          ];
        const marketingCarrier =
          dumpCarriers[segment.relationships.marketing_carrier.data.id];
        const operatingCarrier =
          dumpCarriers[
            segment.relationships.operating_carrier.data.id ||
              segment.relationships.marketing_carrier.data.id
          ];

        const segmentObject = buildSegment({
          origin: origin,
          destination: destination,
          departure: moment(segment.attributes.departure_time).format(
            'YYYYMMDDHHmm'
          ),
          arrival: moment(segment.attributes.arrival_time).format(
            'YYYYMMDDHHmm'
          ),
          marketingCarrier: marketingCarrier,
          operatingCarrier: operatingCarrier,
          vehicleType: segment.relationships.vehicle.data.id.split('-')[0]
        });

        const amenities =
          fareClassesMap[fares[0].fare_class.id].relationships.fare_features
            .data;

        for (const amenity of amenities) {
          const amenityObj = fareFeaturesMap[amenity.id];

          if (!transformedResult.amenities[segmentObject.id]) {
            transformedResult.amenities[segmentObject.id] = [
              {
                id: amenityObj.id,
                name: amenityObj.attributes.name,
                description: amenityObj.attributes.description
              }
            ];
          } else {
            transformedResult.amenities[segmentObject.id].push({
              id: amenityObj.id,
              name: amenityObj.attributes.name,
              description: amenityObj.attributes.description
            });
          }
        }

        transformedResult.segments[segmentObject.id] = segmentObject;
        Segments.push(segmentObject);
      }

      const leg = buildLegFromSegments(Segments);

      let outboundPrice =
        options.currency === 'JPY' || options.currency === 'KRW'
          ? fares[0].price
          : fares[0].price / 100;

      outboundPrice = parseFloat(outboundPrice.toFixed(2));

      transformedResult.legs[leg.id] = leg;

      const outboundItinerary = buildItineraryFromLegs([leg]);

      const carrier =
        dumpCarriers[outboundLeg.relationships.marketing_carrier.data.id];

      const agent: IDictionary<string> = {
        id: Buffer.from(carrier).toString('base64'),
        ...carriers[carrier]
      };

      transformedResult.agents[agent.id] = agent;

      const deepLinkPayload = encodeRedirectPayload({
        provider: 'distribusion',
        agentId: agent.id,
        agentName: agent.name,
        outboundPayload: querystring.stringify({
          marketing_carrier_code: outboundLeg.id.split('-')[0],
          departure_time: outboundLeg.attributes.departure_time,
          arrival_time: outboundLeg.attributes.arrival_time,
          origin: outboundLeg.id.split('-')[1],
          destination: outboundLeg.id.split('-')[2],
          fare_class: outboundLeg.attributes.cheapest_fare_class_code
        })
      });

      outboundItinerary.origin = leg.origin;
      outboundItinerary.destination = leg.destination;

      const linkedItineraries = [];
      const prices = [];

      for (const item of inboundItinerariesArray) {
        if (
          item.destination === leg.origin &&
          item.origin === leg.destination
        ) {
          linkedItineraries.push(item.id);
          prices.push(item.pricingOptions[0].price.amount);
        }
      }

      if (prices.length === 0 || linkedItineraries.length === 0) continue;

      const minPrice = Math.min(...prices);

      outboundItinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkPayload,
          price: {
            from: outboundPrice + minPrice,
            amount: outboundPrice,
            currency: data.meta.currency
          }
        }
      ];

      outboundItinerary.linkedItineraries = linkedItineraries;
      transformedResult.outboundItineraries[outboundItinerary.id] =
        outboundItinerary;
    }
  }

  return transformedResult;
};

export default transformResults;
