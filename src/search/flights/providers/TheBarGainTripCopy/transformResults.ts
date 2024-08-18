import moment from "moment";
import { encodeRedirectPayload, buildSegment, buildLegFromSegments, buildItineraryFromLegs } from '../../../../utils';
import logger from '../../../../configs/logger';

// Define the provider name
const providerName = 'Thebargaintrip';

// Create an agent object with a base64 encoded id and the provider name
const agent = {
    id: Buffer.from(providerName).toString('base64'),
    name: providerName
};

// Function to filter and transform segment data from the flight object
const filterSegmentData = (flight: any) => {
    // Combine date and time for departure and arrival
    const departureDate = `${flight['departureDate']}T${flight['departureTime']}`;
    const arrivalDate = `${flight['arrivalDate']}T${flight['arrivalTime']}`;

    // Create a transformed segment object with formatted dates and other details
    const transformedSegment = {
        origin: flight.origin,
        destination: flight.destination,
        departure: moment.utc(departureDate, 'YYYY-MM-DDTHH:mm').format('YYYYMMDDHHmm'),
        arrival: moment.utc(arrivalDate, 'YYYY-MM-DDTHH:mm').format('YYYYMMDDHHmm'),
        marketingCarrier: flight.operatingAirline,
        operatingCarrier: flight.operatingAirline,
        marketingFlightNumber: flight.flightNumber,
        vehicleType: 'FLIGHT'
    };

    return transformedSegment;
};

// Main function to transform the flight search results
const transformResults = (input: SearchOptions, data: any): TransformedResult => {
    // Initialize the transformed result object
    const transformedResult: TransformedResult = {
        agents: {},
        segments: {},
        legs: {},
        itineraries: {},
        codeShare: {},
        flightDetails: data
    };

    // Add the agent to the transformed result
    transformedResult.agents[agent.id] = agent;
    // Log to verify agent is added
    console.log('Agent added to result:', transformedResult.agents[agent.id]);
    console.log('Full agents object:', transformedResult.agents);
    

    // Check if data contains valid flights
    if (!data || !data.flights || data.flights === null || Object.keys(data).length === 0) {
        logger.error('Invalid flight data');
        transformedResult;
    }

    const offers = data.flights;
    for (const offer of offers) {
        const { price, url, currency } = offer;

        // Check if segment data exists
        if (!offer.segment || offer.segment.length === 0) {
            logger.error('Missing segment data');
            continue;
        }

        const outboundLeg = offer.segment[0].leg;
        let Segments: TransformedSegment[] = [];
        const Legs: TransformedLeg[] = [];

        // Transform each segment of the outbound leg
        for (const seg of outboundLeg) {
            const transformedSeg = filterSegmentData(seg);
            const Segment = buildSegment(transformedSeg);
            Segments.push(Segment);
            transformedResult.segments[Segment.id] = Segment;
            transformedResult.codeShare[`${offer.marketingAirline}${seg.flightNumber}`] = {
                marketingCarrier: offer.marketingAirline,
                operatingCarrier: seg.operatingAirline
            };
        }

        // Build the leg from segments and add to transformed result
        let Leg = buildLegFromSegments(Segments);
        Legs.push(Leg);
        transformedResult.legs[Leg.id] = Leg;
        Segments = [];

        // Handle round trip case
        if (input.tripType === 'round') {
            // Check if inbound leg data exists
            if (!offer.segment[1] || !offer.segment[1].leg) {
                logger.error('Missing inbound leg data');
                continue;
            }

            
            const inboundLeg = offer.segment[1].leg;
            for (const seg of inboundLeg) {
                const transformedSeg = filterSegmentData(seg);
                const Segment = buildSegment(transformedSeg);
                Segments.push(Segment);
                transformedResult.segments[Segment.id] = Segment;
                transformedResult.codeShare[`${offer.marketingAirline}${seg.flightNumber}`] = {
                    marketingCarrier: offer.marketingAirline,
                    operatingCarrier: seg.operatingAirline
                };
            }
            let Leg = buildLegFromSegments(Segments);
            Legs.push(Leg);
            transformedResult.legs[Leg.id] = Leg;
            Segments = [];
        }

        // Build itinerary from legs and add pricing options
        const itinerary = buildItineraryFromLegs(Legs);
        const encodedDeepLink = encodeRedirectPayload({
            provider: providerName,
            agentId: agent.id,
            agentName: agent.name,
            url
        });

        itinerary.pricingOptions = [{
            agent: agent.id,
            agentName: agent.name,
            deepLink: encodedDeepLink,
            price: {
                amount: price,
                currency
            }
        }];

        transformedResult.itineraries[itinerary.id] = itinerary;
    }
    console.log('Transformed result before return:', transformedResult);
    return transformedResult;
}

export default transformResults;
