import moment from 'moment';
import querystring from 'querystring';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

const providerName = 'saveAtrain';

const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName,
  type: 'train'
};

const transformResults = async (
  options: SearchTrainOptions,
  interceptedData: any
): Promise<TransformedTrainResult> => {
  const { data, stations, carriers, dumpStations, dumpCarriers } =
    interceptedData;

  const transformedResult: TransformedTrainResult = {
    agents: {},
    legs: {},
    outboundItineraries: {},
    inboundItineraries: {},
    segments: {},
    stations: stations,
    carriers: carriers
  };
  const currency = 'EUR';

  if (data == undefined || !data.result || data.result.outbound.length === 0) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  if (options.tripType === 'oneway') {
    const { outbound } = data.result;

    for (const trip of outbound) {
      const Segments: TransformedSegment[] = [];
      const Legs: TransformedLeg[] = [];

      const {
        origin_station,
        destin_station,
        departure_date,
        departure_time,
        arrival_date,
        arrival_time,
        operator,
        train_numbers,
        departure_connections,
        arrival_connections,
        connections,
        changes
      } = trip;

      if (changes + 1 !== operator.trim().split(',').length) continue;

      if (changes === 0) {
        const origin = dumpStations[origin_station];
        const destination = dumpStations[destin_station];
        const carrier = dumpCarriers[operator.trim()];
        const segmentObject = buildSegment({
          origin: origin,
          destination: destination,
          departure: moment(`${departure_date}T${departure_time}`).format(
            'YYYYMMDDHHmm'
          ),
          arrival: moment(`${arrival_date}T${arrival_time}`).format(
            'YYYYMMDDHHmm'
          ),
          marketingCarrier: carrier,
          operatingCarrier: carrier,
          trainNumber: train_numbers,
          vehicleType: 'TRAIN'
        });

        transformedResult.segments[segmentObject.id] = segmentObject;
        Segments.push(segmentObject);
      } else {
        const splittedConnections = connections.split(',');
        const splittedOperators = operator.split(',');
        const splittedTrainNumbers = train_numbers.split(',');
        const departureConnections = departure_connections.split(',');
        const arrivalConnections = arrival_connections.split(',');

        for (let i = 0; i < changes; i++) {
          if (i === 0) {
            const origin = dumpStations[origin_station.trim()];
            const destination = dumpStations[splittedConnections[i].trim()];
            const carrier = dumpCarriers[splittedOperators[i].trim()];
            const segmentObject = buildSegment({
              origin: origin,
              destination: destination,
              departure: moment(`${departure_date}T${departure_time}`).format(
                'YYYYMMDDHHmm'
              ),
              arrival: moment(
                `${departure_date}T${arrivalConnections[i].trim()}`
              ).format('YYYYMMDDHHmm'),
              marketingCarrier: carrier,
              operatingCarrier: carrier,
              trainNumber: splittedTrainNumbers[i],
              vehicleType: 'TRAIN'
            });

            transformedResult.segments[segmentObject.id] = segmentObject;
            Segments.push(segmentObject);
          } else if (changes === i + 1) {
            const origin = dumpStations[splittedConnections[i].trim()];
            const destination = dumpStations[destin_station.trim()];
            const carrier = dumpCarriers[splittedOperators[i].trim()];
            const segmentObject = buildSegment({
              origin: origin,
              destination: destination,
              departure: moment(
                `${arrival_date}T${departureConnections[i].trim()}`
              ).format('YYYYMMDDHHmm'),
              arrival: moment(`${arrival_date}T${arrival_time}`).format(
                'YYYYMMDDHHmm'
              ),
              marketingCarrier: carrier,
              operatingCarrier: carrier,
              trainNumber: splittedTrainNumbers[i],
              vehicleType: 'TRAIN'
            });

            transformedResult.segments[segmentObject.id] = segmentObject;
            Segments.push(segmentObject);
          } else {
            const origin = dumpStations[splittedConnections[i].trim()];
            const destination = dumpStations[splittedConnections[i + 1].trim()];
            const carrier = dumpCarriers[splittedOperators[i].trim()];
            const segmentObject = buildSegment({
              origin: origin,
              destination: destination,
              departure: moment(
                `${departure_date}T${departureConnections[i].trim()}`
              ).format('YYYYMMDDHHmm'),
              arrival: moment(
                `${departure_date}T${arrivalConnections[i + 1].trim()}`
              ).format('YYYYMMDDHHmm'),
              marketingCarrier: carrier,
              operatingCarrier: carrier,
              trainNumber: splittedTrainNumbers[i],
              vehicleType: 'TRAIN'
            });

            transformedResult.segments[segmentObject.id] = segmentObject;
            Segments.push(segmentObject);
          }
        }
      }

      const OutBoundLeg = buildLegFromSegments(Segments);

      transformedResult.legs[OutBoundLeg.id] = OutBoundLeg;
      Legs.push(OutBoundLeg);

      const itinerary = buildItineraryFromLegs(Legs);
      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        outboundPayload: querystring.stringify({
          origin: origin_station,
          destination: destin_station,
          departure_date: departure_date,
          departure_time: departure_time
        })
      });

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkPayload,
          price: {
            amount: trip.price.second_class,
            currency
          }
        }
      ];

      transformedResult.outboundItineraries[itinerary.id] = itinerary;
    }
  } else if (options.tripType === 'round') {
    const { outbound, inbound } = data.result;
    const linkedItineraries = [];

    for (const trip of inbound) {
      const Segments: TransformedSegment[] = [];
      const Legs: TransformedLeg[] = [];

      const {
        origin_station,
        destin_station,
        departure_date,
        departure_time,
        arrival_date,
        arrival_time,
        operator,
        train_numbers,
        departure_connections,
        arrival_connections,
        connections,
        changes
      } = trip;

      if (changes + 1 !== operator.trim().split(',').length) continue;

      if (changes === 0) {
        const origin = dumpStations[origin_station];
        const destination = dumpStations[destin_station];
        const carrier = dumpCarriers[operator.trim()];
        const segmentObject = buildSegment({
          origin: origin,
          destination: destination,
          departure: moment(`${departure_date}T${departure_time}`).format(
            'YYYYMMDDHHmm'
          ),
          arrival: moment(`${arrival_date}T${arrival_time}`).format(
            'YYYYMMDDHHmm'
          ),
          marketingCarrier: carrier,
          operatingCarrier: carrier,
          trainNumber: train_numbers,
          vehicleType: 'TRAIN'
        });

        transformedResult.segments[segmentObject.id] = segmentObject;
        Segments.push(segmentObject);
      } else {
        const splittedConnections = connections.split(',');
        const splittedOperators = operator.split(',');
        const splittedTrainNumbers = train_numbers.split(',');
        const departureConnections = departure_connections.split(',');
        const arrivalConnections = arrival_connections.split(',');

        for (let i = 0; i < changes; i++) {
          if (i === 0) {
            const origin = dumpStations[origin_station.trim()];
            const destination = dumpStations[splittedConnections[i].trim()];
            const carrier = dumpCarriers[splittedOperators[i].trim()];
            const segmentObject = buildSegment({
              origin: origin,
              destination: destination,
              departure: moment(`${departure_date}T${departure_time}`).format(
                'YYYYMMDDHHmm'
              ),
              arrival: moment(
                `${departure_date}T${arrivalConnections[i].trim()}`
              ).format('YYYYMMDDHHmm'),
              marketingCarrier: carrier,
              operatingCarrier: carrier,
              trainNumber: splittedTrainNumbers[i],
              vehicleType: 'TRAIN'
            });

            transformedResult.segments[segmentObject.id] = segmentObject;
            Segments.push(segmentObject);
          } else if (changes === i + 1) {
            const origin = dumpStations[splittedConnections[i].trim()];
            const destination = dumpStations[destin_station.trim()];
            const carrier = dumpCarriers[splittedOperators[i].trim()];
            const segmentObject = buildSegment({
              origin: origin,
              destination: destination,
              departure: moment(
                `${arrival_date}T${departureConnections[i].trim()}`
              ).format('YYYYMMDDHHmm'),
              arrival: moment(`${arrival_date}T${arrival_time}`).format(
                'YYYYMMDDHHmm'
              ),
              marketingCarrier: carrier,
              operatingCarrier: carrier,
              trainNumber: splittedTrainNumbers[i],
              vehicleType: 'TRAIN'
            });

            transformedResult.segments[segmentObject.id] = segmentObject;
            Segments.push(segmentObject);
          } else {
            const origin = dumpStations[splittedConnections[i].trim()];
            const destination = dumpStations[splittedConnections[i + 1].trim()];
            const carrier = dumpCarriers[splittedOperators[i].trim()];
            const segmentObject = buildSegment({
              origin: origin,
              destination: destination,
              departure: moment(
                `${departure_date}T${departureConnections[i].trim()}`
              ).format('YYYYMMDDHHmm'),
              arrival: moment(
                `${departure_date}T${arrivalConnections[i + 1].trim()}`
              ).format('YYYYMMDDHHmm'),
              marketingCarrier: carrier,
              operatingCarrier: carrier,
              trainNumber: splittedTrainNumbers[i],
              vehicleType: 'TRAIN'
            });

            transformedResult.segments[segmentObject.id] = segmentObject;
            Segments.push(segmentObject);
          }
        }
      }

      const OutBoundLeg = buildLegFromSegments(Segments);

      transformedResult.legs[OutBoundLeg.id] = OutBoundLeg;
      Legs.push(OutBoundLeg);

      const itinerary = buildItineraryFromLegs(Legs);
      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        inboundPayload: querystring.stringify({
          return_date: arrival_date,
          return_time: arrival_time
        })
      });

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkPayload,
          price: {
            amount: trip.price.second_class,
            currency
          }
        }
      ];

      transformedResult.inboundItineraries[itinerary.id] = itinerary;
    }

    const inboundItinerariesArray = Object.values(
      transformedResult.inboundItineraries
    );

    for (const trip of outbound) {
      const Segments: TransformedSegment[] = [];
      const Legs: TransformedLeg[] = [];

      const {
        origin_station,
        destin_station,
        departure_date,
        departure_time,
        arrival_date,
        arrival_time,
        operator,
        train_numbers,
        departure_connections,
        arrival_connections,
        connections,
        changes
      } = trip;

      if (changes + 1 !== operator.trim().split(',').length) continue;

      if (changes === 0) {
        const origin = dumpStations[origin_station];
        const destination = dumpStations[destin_station];
        const carrier = dumpCarriers[operator.trim()];
        const segmentObject = buildSegment({
          origin: origin,
          destination: destination,
          departure: moment(`${departure_date}T${departure_time}`).format(
            'YYYYMMDDHHmm'
          ),
          arrival: moment(`${arrival_date}T${arrival_time}`).format(
            'YYYYMMDDHHmm'
          ),
          marketingCarrier: carrier,
          operatingCarrier: carrier,
          trainNumber: train_numbers,
          vehicleType: 'TRAIN'
        });

        transformedResult.segments[segmentObject.id] = segmentObject;
        Segments.push(segmentObject);
      } else {
        const splittedConnections = connections.split(',');
        const splittedOperators = operator.split(',');
        const splittedTrainNumbers = train_numbers.split(',');
        const departureConnections = departure_connections.split(',');
        const arrivalConnections = arrival_connections.split(',');

        for (let i = 0; i < changes; i++) {
          if (i === 0) {
            const origin = dumpStations[origin_station.trim()];
            const destination = dumpStations[splittedConnections[i].trim()];
            const carrier = dumpCarriers[splittedOperators[i].trim()];
            const segmentObject = buildSegment({
              origin: origin,
              destination: destination,
              departure: moment(`${departure_date}T${departure_time}`).format(
                'YYYYMMDDHHmm'
              ),
              arrival: moment(
                `${departure_date}T${arrivalConnections[i].trim()}`
              ).format('YYYYMMDDHHmm'),
              marketingCarrier: carrier,
              operatingCarrier: carrier,
              trainNumber: splittedTrainNumbers[i],
              vehicleType: 'TRAIN'
            });

            transformedResult.segments[segmentObject.id] = segmentObject;
            Segments.push(segmentObject);
          } else if (changes === i + 1) {
            const origin = dumpStations[splittedConnections[i].trim()];
            const destination = dumpStations[destin_station.trim()];
            const carrier = dumpCarriers[splittedOperators[i].trim()];
            const segmentObject = buildSegment({
              origin: origin,
              destination: destination,
              departure: moment(
                `${arrival_date}T${departureConnections[i].trim()}`
              ).format('YYYYMMDDHHmm'),
              arrival: moment(`${arrival_date}T${arrival_time}`).format(
                'YYYYMMDDHHmm'
              ),
              marketingCarrier: carrier,
              operatingCarrier: carrier,
              trainNumber: splittedTrainNumbers[i],
              vehicleType: 'TRAIN'
            });

            transformedResult.segments[segmentObject.id] = segmentObject;
            Segments.push(segmentObject);
          } else {
            const origin = dumpStations[splittedConnections[i].trim()];
            const destination = dumpStations[splittedConnections[i + 1].trim()];
            const carrier = dumpCarriers[splittedOperators[i].trim()];
            const segmentObject = buildSegment({
              origin: origin,
              destination: destination,
              departure: moment(
                `${departure_date}T${departureConnections[i].trim()}`
              ).format('YYYYMMDDHHmm'),
              arrival: moment(
                `${departure_date}T${arrivalConnections[i + 1].trim()}`
              ).format('YYYYMMDDHHmm'),
              marketingCarrier: carrier,
              operatingCarrier: carrier,
              trainNumber: splittedTrainNumbers[i],
              vehicleType: 'TRAIN'
            });

            transformedResult.segments[segmentObject.id] = segmentObject;
            Segments.push(segmentObject);
          }
        }
      }

      const OutBoundLeg = buildLegFromSegments(Segments);

      transformedResult.legs[OutBoundLeg.id] = OutBoundLeg;
      Legs.push(OutBoundLeg);

      const itinerary = buildItineraryFromLegs(Legs);

      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        outboundPayload: querystring.stringify({
          origin: origin_station,
          destination: destin_station,
          departure_date: departure_date,
          departure_time: departure_time
        })
      });

      const minPrice = Math.min(
        ...inboundItinerariesArray.map((item) => {
          linkedItineraries.push(item.id);
          transformedResult.inboundItineraries[
            item.id
          ].pricingOptions[0].price.amount += trip.price.second_class;
          return item.pricingOptions[0].price.amount;
        })
      );

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkPayload,
          price: {
            from: minPrice,
            amount: trip.price.second_class,
            currency
          }
        }
      ];
      itinerary.linkedItineraries = linkedItineraries;
      transformedResult.outboundItineraries[itinerary.id] = itinerary;
    }
  } else if (options.tripType === 'multi') {
    transformedResult['error'] = 'No data found.';
  }

  return transformedResult;
};

export default transformResults;
