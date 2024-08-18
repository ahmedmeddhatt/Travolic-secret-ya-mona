import moment from 'moment';
import {
  buildLegFromSegments,
  buildSegment,
  buildItineraryFromLegs,
  encodeRedirectPayload
} from '../../../../utils';

const providerName = 'skybooker';
const agent = {
  id: Buffer.from('Destina Holidays').toString('base64'),
  name: 'Destina Holidays',
  isAirline: false
};

const allow_currency = ['BHD', 'KWD', 'OMR', 'QAR', 'SAR', 'AED'];
const allow_countries = ['BH', 'KW', 'OM', 'QA', 'SA', 'AE'];

const generateDeepLink = (options: SearchOptions, data: any): string => {
  let reference = '';

  for (const ref of data.Recommendation[0].Reference) {
    for (const refhash of ref.Segment[0].FlightSegment) {
      reference += refhash + ';';
    }
  }

  const link =
    allow_countries.includes(options.country) &&
    allow_currency.includes(options.currency)
      ? `https://skybooker.ae/book-flights/?track_id=travolic&ref=${reference}`
      : `https://skybooker.com/book-flights/?track_id=travolic&ref=${reference}`;

  return link;
};

const transformResults = (
  options: SearchOptions,
  data: any
): TransformedResult => {
  const transformedResult: TransformedResult = {
    agents: {},
    legs: {},
    itineraries: {},
    segments: {},
    codeShare: {}
  };

  if (Object.keys(data).length === 0) {
    transformedResult['error'] = 'No data found.';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  for (const itinerary of data) {
    const Legs: TransformedLeg[] = [];
    const segmentsBookingCodes = {};
    const BaggagesInKilos = [];
    const totalBaggages = [];

    for (const flight of itinerary.Segment[0].FlightSegment) {
      const Segments: TransformedSegment[] = [];

      for (const segment of flight.FlightDetails[0].FlightSegment) {
        const {
          From,
          To,
          DepartureDate,
          DepartureTime,
          ArrivalTime,
          ArrivalDate,
          MarketingCarrier,
          OperatingCarrier,
          FlightNumber,
          Rbd
        } = segment;
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: From[0].Location[0],
          destination: To[0].Location[0],
          departure: moment
            .utc(`${DepartureDate[0]} ${DepartureTime[0]}`, 'DDMMYY HHmm')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(`${ArrivalDate[0]} ${ArrivalTime[0]}`, 'DDMMYY HHmm')
            .format('YYYYMMDDHHmm'),
          marketingCarrier: MarketingCarrier[0],
          operatingCarrier: OperatingCarrier
            ? OperatingCarrier[0]
            : MarketingCarrier[0],
          marketingFlightNumber: FlightNumber[0],
          vehicleType: 'FLIGHT'
        };
        const segment_item = buildSegment(transFormedSegment);

        Segments.push(segment_item);
        segmentsBookingCodes[segment_item.id] = {
          bookingCode: Rbd[0]
        };

        if (OperatingCarrier) {
          transformedResult.codeShare[
            `${MarketingCarrier[0]}${FlightNumber[0]}`
          ] = {
            marketingCarrier: MarketingCarrier[0],
            operatingCarrier: OperatingCarrier[0]
          };
        }

        transformedResult.segments[segment_item.id] = segment_item;
      }

      const leg = buildLegFromSegments(Segments);

      Legs.push(leg);

      if (
        flight.FlightDetails[0].BaggageInformation[0].QuantityCode[0] === 'W'
      ) {
        BaggagesInKilos.push(
          Number(flight.FlightDetails[0].BaggageInformation[0].FreeAllowance[0])
        );
      } else {
        totalBaggages.push(
          Number(flight.FlightDetails[0].BaggageInformation[0].FreeAllowance[0])
        );
      }

      transformedResult.legs[leg.id] = leg;
    }

    const itinerary_info = buildItineraryFromLegs(Legs);
    const deepLinkPayload = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url: generateDeepLink(options, itinerary)
    });

    itinerary_info.pricingOptions = [
      {
        agent: agent.id,
        agentName: agent.name,
        deepLink: deepLinkPayload,
        price: {
          amount: parseFloat(itinerary.Recommendation[0].TotalFare[0]),
          currency: itinerary.Recommendation[0].Currency[0]
        },
        meta: {
          baggage: {
            BaggagesInKilos:
              BaggagesInKilos.length > 0
                ? Math.max(...BaggagesInKilos)
                : undefined,
            totalBaggages:
              totalBaggages.length > 0 ? Math.max(...totalBaggages) : undefined
          },
          segments: segmentsBookingCodes
        }
      }
    ];
    transformedResult.itineraries[itinerary_info.id] = itinerary_info;
  }

  return transformedResult;
};

export default transformResults;
