import moment from 'moment';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

const providerName = 'Bookdreamfares';
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
    codeShare: {},
    flightDetails: data
  };

  transformedResult.agents[agent.id] = agent;
  if (Object.keys(data).length === 0) {
    transformedResult['error'] = 'No result found';
    return transformedResult;
  }

  if (options.tripType === 'oneway') {
    for (const trip of data['flights']) {
      const Segmants: TransformedSegment[] = [];
      const Legs: TransformedLeg[] = [];
      for (const seg of trip['segment'][0]['seg']) {
        const {
          depDate,
          depTime,
          depAirport,
          arrDate,
          arrTime,
          arrAirport,
          operatingAirline,
          airline,
          flightNumber
        } = seg;
        const depdateTime = `${depDate}${depTime}`;
        const arrdateTime = `${arrDate}${arrTime}`;
        const transformedSegment: TransformedSegmentWithoutID = {
          origin: depAirport,
          destination: arrAirport,
          marketingCarrier: airline,
          operatingCarrier: operatingAirline ? operatingAirline : airline,
          departure: moment
            .utc(depdateTime, 'YYYY-MM-DDHH:mm')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(arrdateTime, 'YYYY-MM-DDHH:mm')
            .format('YYYYMMDDHHmm'),
          marketingFlightNumber: flightNumber,
          vehicleType: 'FLIGHT'
        };
        const segment = buildSegment(transformedSegment);
        Segmants.push(segment);
        transformedResult.segments[segment.id] = segment;
        transformedResult.codeShare[`${airline}${flightNumber}`] = {
          marketingCarrier: airline,
          operatingCarrier: operatingAirline ? operatingAirline : airline
        };
      }
      const leg = buildLegFromSegments(Segmants);
      Legs.push(leg);
      transformedResult.legs[leg.id] = leg;

      const itinerary = buildItineraryFromLegs(Legs);

      const deepLinkpayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: trip['redirectUrl']
      });
      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkpayload,
          price: {
            amount: trip['totalPrice'],
            currency: trip['currency']
          }
        }
      ];
      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  } else {
    for (const trip of data['flights']) {
      let Segments: TransformedSegment[] = [];
      const Legs: TransformedLeg[] = [];
      for (const seg of trip['segment'][0]['seg']) {
        const {
          depDate,
          depTime,
          depAirport,
          arrDate,
          arrTime,
          arrAirport,
          operatingAirline,
          airline,
          flightNumber
        } = seg;
        const depdateTime = `${depDate}${depTime}`;
        const arrdateTime = `${arrDate}${arrTime}`;
        const transformedSegment: TransformedSegmentWithoutID = {
          origin: depAirport,
          destination: arrAirport,
          marketingCarrier: airline,
          operatingCarrier: operatingAirline ? operatingAirline : airline,
          departure: moment
            .utc(depdateTime, 'YYYY-MM-DDHH:mm')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(arrdateTime, 'YYYY-MM-DDHH:mm')
            .format('YYYYMMDDHHmm'),
          marketingFlightNumber: flightNumber,
          vehicleType: 'FLIGHT'
        };
        const segment = buildSegment(transformedSegment);
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
        transformedResult.codeShare[`${airline}${flightNumber}`] = {
          marketingCarrier: airline,
          operatingCarrier: operatingAirline ? operatingAirline : airline
        };
      }
      let leg = buildLegFromSegments(Segments);
      Legs.push(leg);
      transformedResult.legs[leg.id] = leg;
      Segments = [];

      for (const seg of trip['segment'][1]['seg']) {
        const {
          depDate,
          depTime,
          depAirport,
          arrDate,
          arrTime,
          arrAirport,
          operatingAirline,
          airline,
          flightNumber
        } = seg;
        const depdateTime = `${depDate}${depTime}`;
        const arrdateTime = `${arrDate}${arrTime}`;
        const transformedSegment: TransformedSegmentWithoutID = {
          origin: depAirport,
          destination: arrAirport,
          marketingCarrier: airline,
          operatingCarrier: operatingAirline ? operatingAirline : airline,
          departure: moment
            .utc(depdateTime, 'YYYY-MM-DDHH:mm')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(arrdateTime, 'YYYY-MM-DDHH:mm')
            .format('YYYYMMDDHHmm'),
          marketingFlightNumber: flightNumber,
          vehicleType: 'FLIGHT'
        };
        const segment = buildSegment(transformedSegment);
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
        transformedResult.codeShare[`${airline}${flightNumber}`] = {
          marketingCarrier: airline,
          operatingCarrier: operatingAirline ? operatingAirline : airline
        };
      }
      leg = buildLegFromSegments(Segments);
      Legs.push(leg);
      transformedResult.legs[leg.id] = leg;
      const itinerary = buildItineraryFromLegs(Legs);
      const deepLinkpayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: trip['redirectUrl']
      });
      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkpayload,
          price: {
            amount: trip['totalPrice'],
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
