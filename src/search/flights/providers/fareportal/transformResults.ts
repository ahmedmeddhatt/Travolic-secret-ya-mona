import moment from 'moment';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

const providerName = 'fareportal';

const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

type Response = any;

function transformResults(_: SearchOptions, data: Response): TransformedResult {
  // create our response transformer
  const trnsformedResult: TransformedResult = {
    agents: {},
    legs: {},
    itineraries: {},
    segments: {}
  };

  // check if api return flights
  if (data.FlightResponse.ErrorReport !== null) {
    trnsformedResult['error'] = 'No data found.';
    return trnsformedResult;
  }

  // object will have all segments outbound and inbound
  const InBoundAndOutBoundSegments = {};

  trnsformedResult.agents[agent.id] = agent;
  const segmentsData =
    data.FlightResponse.FpSearch_AirLowFaresRS.OriginDestinationOptions;
  const { RefDetails } =
    data.FlightResponse.FpSearch_AirLowFaresRS.SegmentReference;

  //push outbound segment to our object
  segmentsData.OutBoundOptions.OutBoundOption.forEach(function (seg_data) {
    InBoundAndOutBoundSegments[seg_data.Segmentid] = seg_data;
  });
  //push inbound segment to our object
  segmentsData.InBoundOptions.InBoundOption.forEach(function (seg_data) {
    InBoundAndOutBoundSegments[seg_data.Segmentid] = seg_data;
  });

  //start loop
  RefDetails.forEach(function (ref_details) {
    const Legs: TransformedLeg[] = [];
    const itineraryLegs = [
      ref_details.OutBoundOptionId,
      ref_details.InBoundOptionId
    ];
    itineraryLegs.forEach(function (leg) {
      if (!leg || leg.length < 1) {
        return;
      }
      const Segments: TransformedSegment[] = [];
      leg.forEach(function (segment_id) {
        const seg_info = InBoundAndOutBoundSegments[segment_id];
        seg_info.FlightSegment.forEach(function (seg) {
          const segment = buildSegment({
            origin: seg.DepartureAirport.LocationCode, //segment departure airport code
            destination: seg.ArrivalAirport.LocationCode, //segment arrival airport code
            departure: moment
              .utc(seg.DepartureDateTime, 'DDMMMYYYYTHH:mm A')
              .format('YYYYMMDDHHmm'),
            arrival: moment
              .utc(seg.ArrivalDateTime, 'DDMMMYYYYTHH:mm A')
              .format('YYYYMMDDHHmm'),
            marketingCarrier: seg.MarketingAirline.Code,
            operatingCarrier: seg.OperatedByAirline.Code,
            marketingFlightNumber: seg.FlightNumber,
            vehicleType: 'FLIGHT'
          });
          Segments.push(segment);
          trnsformedResult.segments[segment.id] = segment;
        });
      });

      const Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      trnsformedResult.legs[Leg.id] = Leg;
    });
    // create Itinerary
    const itinerary = buildItineraryFromLegs(Legs);
    const deepLinkPayload = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url: 'https://travolic.com'
    });

    itinerary.pricingOptions = [
      {
        agent: agent.id,
        agentName: agent.name,
        deepLink: deepLinkPayload,
        price: {
          amount: ref_details.PTC_FareBreakdown.Adult.TotalAdultFare,
          currency:
            data.FlightResponse.FpSearch_AirLowFaresRS.Currency.CurrencyCode
        }
      }
    ];

    trnsformedResult.itineraries[itinerary.id] = itinerary;
  });

  return trnsformedResult;
}

export default transformResults;
