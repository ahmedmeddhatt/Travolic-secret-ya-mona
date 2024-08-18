import {
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs,
  encodeRedirectPayload
} from '../../../../utils';

import moment from 'moment';

const providerName = 'WorldTourStore';

const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const transformResults = (
  options: SearchOptions,
  data: any
): TransformedResult => {
  const transformedResult: TransformedResult = {
    agents: {},
    segments: {},
    legs: {},
    itineraries: {},
    codeShare: {}
  };

  if (
    Object.keys(data).length === 0 ||
    !data.data.itineraries ||
    data.data.itineraries.length === 0
  ) {
    transformedResult['error'] = 'No data found';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  if (options.tripType === 'oneway') {
    for (const trip of data['data']['itineraries']) {
      const Segments: TransformedSegment[] = [];
      const Legs: TransformedLeg[] = [];

      for (const seg of trip['route']['departures']) {
        const {
          flyFrom,
          flyTo,
          airline,
          flightNo,
          operatingCarrier,
          utcDeparture,
          utcArrival
        } = seg;
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: flyFrom,
          destination: flyTo,
          departure: moment.utc(utcDeparture).format('YYYYMMDDHHmm'),
          arrival: moment.utc(utcArrival).format('YYYYMMDDHHmm'),
          marketingCarrier: airline,
          operatingCarrier: operatingCarrier ? operatingCarrier : airline,
          marketingFlightNumber: flightNo,
          vehicleType: 'FLIGHT'
        };
        const segment = buildSegment(transFormedSegment);

        transformedResult.codeShare[`${airline}${flightNo}`] = {
          marketingCarrier: airline,
          operatingCarrier: operatingCarrier ? operatingCarrier : airline
        };
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
      }

      const Leg = buildLegFromSegments(Segments);

      Legs.push(Leg);

      transformedResult.legs[Leg.id] = Leg;

      const itinerary = buildItineraryFromLegs(Legs);
      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: trip['deepLink']
      });

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkPayload,
          price: {
            amount: trip['price'],
            currency: trip['currency']
          }
        }
      ];
      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  } else {
    for (const trip of data['data']['itineraries']) {
      const Legs: TransformedLeg[] = [];
      let Segments: TransformedSegment[] = [];

      for (const seg of trip['route']['departures']) {
        const {
          flyFrom,
          flyTo,
          airline,
          flightNo,
          operatingCarrier,
          utcDeparture,
          utcArrival
        } = seg;
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: flyFrom,
          destination: flyTo,
          departure: moment.utc(utcDeparture).format('YYYYMMDDHHmm'),
          arrival: moment.utc(utcArrival).format('YYYYMMDDHHmm'),
          marketingCarrier: airline,
          operatingCarrier: operatingCarrier ? operatingCarrier : airline,
          marketingFlightNumber: flightNo,
          vehicleType: 'FLIGHT'
        };
        const segment = buildSegment(transFormedSegment);

        transformedResult.codeShare[`${airline}${flightNo}`] = {
          marketingCarrier: airline,
          operatingCarrier: operatingCarrier ? operatingCarrier : airline
        };
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
      }

      let Leg = buildLegFromSegments(Segments);

      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
      Segments = [];

      for (const seg of trip['route']['returns']) {
        const {
          flyFrom,
          flyTo,
          airline,
          flightNo,
          operatingCarrier,
          utcDeparture,
          utcArrival
        } = seg;
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: flyFrom,
          destination: flyTo,
          departure: moment.utc(utcDeparture).format('YYYYMMDDHHmm'),
          arrival: moment.utc(utcArrival).format('YYYYMMDDHHmm'),
          marketingCarrier: airline,
          operatingCarrier: operatingCarrier ? operatingCarrier : airline,
          marketingFlightNumber: flightNo,
          vehicleType: 'FLIGHT'
        };
        const segment = buildSegment(transFormedSegment);

        transformedResult.codeShare[`${airline}${flightNo}`] = {
          marketingCarrier: airline,
          operatingCarrier: operatingCarrier ? operatingCarrier : airline
        };
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
      }

      Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;

      const itinerary = buildItineraryFromLegs(Legs);
      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: trip['deepLink']
      });

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkPayload,
          price: {
            amount: trip['price'],
            currency: trip['currency']
          }
        }
      ];
      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  }
  return transformedResult;
};
export default transformResults;
