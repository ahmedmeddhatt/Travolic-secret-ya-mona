import moment from 'moment';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

const providerName = 'Farehutz';
// creating agent object
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
    itineraries: {}
  };
  // 1- fill agents
  transformedResult.agents[agent.id] = agent;

  // check if no data
  if (
    Object.keys(data).length === 0 ||
    !data['variants'] ||
    !data['variants']['variant']
  ) {
    transformedResult['error'] = 'No results found';
    return transformedResult;
  }

  // oneway datatype
  if (options.tripType === 'oneway') {
    // loop on each variant (ticket)
    for (const trip of data['variants']['variant']) {
      const Segments: TransformedSegment[] = [];
      const Legs: TransformedLeg[] = [];
      
      // extracting data from each segment to transform it back to our schema 
      for (const seg of trip['segment'][0]['flight']) {
        const {
          arrival,
          arrivalDate,
          arrivalTime,
          departure,
          departureDate,
          departureTime,
          marketingCarrier,
          operatingCarrier,
          number
        } = seg;
        
        // composing departure & arrival dates
        const depdateTime = `${departureDate[0]}${departureTime[0]}`;
        const arrdateTime = `${arrivalDate[0]}${arrivalTime[0]}`;

        // transomforming extracted data to our schema
        const transformedSegment: TransformedSegmentWithoutID = {
          origin: departure[0],
          destination: arrival[0],
          marketingCarrier: marketingCarrier[0],
          operatingCarrier: operatingCarrier
            ? operatingCarrier[0]
            : marketingCarrier[0],
          departure: moment
            .utc(depdateTime, 'YYYY-MM-DDHH:mm')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(arrdateTime, 'YYYY-MM-DDHH:mm')
            .format('YYYYMMDDHHmm'),
          marketingFlightNumber: number[0],
          vehicleType: 'FLIGHT'
        };

        // build segment then add it to segments arr
        const segment = buildSegment(transformedSegment);
        Segments.push(segment);

        // 2- fill segments
        transformedResult.segments[segment.id] = segment;
      };

      // build leg then add it to legs arr
      const leg = buildLegFromSegments(Segments);
      Legs.push(leg);

      // 3- fill legs
      transformedResult.legs[leg.id] = leg;

      // build itinerary to return id directly
      const itinerary = buildItineraryFromLegs(Legs);

      // composing deep link 
      const deepLinkpayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: trip['url'][0]
      });

      // adding pricing options to the itinerary
      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkpayload,
          price: {
            amount: trip['price'],
            currency: trip['currency']
          }
        }
      ];

      // 4- fill itineraries
      transformedResult.itineraries[itinerary.id] = itinerary;
    };
  } else {
  // round datatype 
    // loop on each variant (ticket)
    for (const trip of data['variants']['variant']) {
      let Segments: TransformedSegment[] = [];
      const Legs: TransformedLeg[] = [];

    // extracting data from each segment to transform it back to our schema 
    // first: outboud trip
      for (const seg of trip['segment'][0]['flight']) {
        const {
          arrival,
          arrivalDate,
          arrivalTime,
          departure,
          departureDate,
          departureTime,
          marketingCarrier,
          number,
          operatingCarrier
        } = seg;

        // composing departure & arrival dates
        const depdateTime = `${departureDate[0]}${departureTime[0]}`;
        const arrdateTime = `${arrivalDate[0]}${arrivalTime[0]}`;

        // transomforming extracted data to our schema
        const transformedSegment: TransformedSegmentWithoutID = {
          origin: departure[0],
          destination: arrival[0],
          marketingCarrier: marketingCarrier[0],
          operatingCarrier: operatingCarrier
            ? operatingCarrier[0]
            : marketingCarrier[0],
          departure: moment
            .utc(depdateTime, 'YYYY-MM-DDHH:mm')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(arrdateTime, 'YYYY-MM-DDHH:mm')
            .format('YYYYMMDDHHmm'),
          marketingFlightNumber: number[0],
          vehicleType: 'FLIGHT'
        };

        // build segment then add it to segments arr
        const segment = buildSegment(transformedSegment);
        Segments.push(segment);
        
        // 2- fill segments
        transformedResult.segments[segment.id] = segment;
      };

      // build leg then add it to legs arr
      let leg = buildLegFromSegments(Segments);
      Legs.push(leg);

      // 3- fill legs
      transformedResult.legs[leg.id] = leg;
      Segments = [];

      // second: return trip
      for (const seg of trip['segment'][1]['flight']) {
        const {
          arrival,
          arrivalDate,
          arrivalTime,
          departure,
          departureDate,
          departureTime,
          marketingCarrier,
          number,
          operatingCarrier
        } = seg;

        // composing departure & arrival dates
        const depdateTime = `${departureDate[0]}${departureTime[0]}`;
        const arrdateTime = `${arrivalDate[0]}${arrivalTime[0]}`;

        // transomforming extracted data to our schema
        const transformedSegment: TransformedSegmentWithoutID = {
          origin: departure[0],
          destination: arrival[0],
          marketingCarrier: marketingCarrier[0],
          operatingCarrier: operatingCarrier
            ? operatingCarrier[0]
            : marketingCarrier[0],
          departure: moment
            .utc(depdateTime, 'YYYY-MM-DDHH:mm')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(arrdateTime, 'YYYY-MM-DDHH:mm')
            .format('YYYYMMDDHHmm'),
          marketingFlightNumber: number[0],
          vehicleType: 'FLIGHT'
        };

        // build segment then add it to segments arr
        const segment = buildSegment(transformedSegment);
        Segments.push(segment);

        // 2- fill segments
        transformedResult.segments[segment.id] = segment;
      };

      // build leg then add it to legs arr
      leg = buildLegFromSegments(Segments);
      Legs.push(leg);

      // 3- fill legs
      transformedResult.legs[leg.id] = leg;

      // build itinerary to return id directly
      const itinerary = buildItineraryFromLegs(Legs);
      
      // composing deep link 
      const deepLinkpayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: trip['url'][0]
      });
      
      // adding pricing options to the itinerary
      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkpayload,
          price: {
            amount: trip['price'],
            currency: trip['currency']
          }
        }
      ];
      
      
      // 4- fill itineraries
      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  }; 
  return transformedResult;
};

export default transformResults;
