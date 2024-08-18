import moment from 'moment';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

const cabinClassMap: IDictionary<string> = {
  Economy: 'E',
  Premium_Economy: 'PE',
  First: 'F',
  Business: 'B'
};

const roundTrip = (
  transformedResult: TransformedResult,
  results: any,
  posData: any,
  options: SearchOptions,
  providerName: string,
  agent: IDictionary<string>
): TransformedResult => {
  for (const result of results) {
    const outboundTrips = [];
    const inboundTrips = [];

    if (!result.Trips) continue;

    const trips = result.Trips;

    trips.forEach((trip: any, tripIndex: number) => {
      const legs = trip.Journey;

      for (const leg of legs) {
        const segments = leg.Segments;
        const Segments: TransformedSegment[] = [];

        let deepLink;
        const price = segments[0].Fares.NetFare;
        let ownsetId = '';

        if (tripIndex === 0) {
          let fromCity = segments[0].Flight.DepAirportName.split('|');
          fromCity = fromCity[1];
          let toCity =
            segments[segments.length - 1].Flight.ArrAirportName.split('|');
          toCity = toCity[1];
          deepLink = `${posData.deepLinkURL}?secType=DOM&srType=R&utl=${
            result.TUI
          }&fromCity=${fromCity}&toCity=${toCity}&from=${result.From}&to=${
            result.To
          }&owDt=${options.legs[0].departure}&rtDt=${
            options.legs[1].departure
          }&adCnt=${options.adults}&chCnt=${options.children}&inCnt=${
            options.infants
          }&class=${cabinClassMap[options.cabinClass]}&ntAmt=${
            segments[0].Fares.NetFare
          }&isRsf=True&Travolic_redirectid=vtVdBjpBSPCmXBHEJDMrdw&utm_medium=flights_meta&utm_source=Travolic&utm_campaign=Travolic&process=flightselected`;
        }

        segments.forEach((seg: any, segIndex: number) => {
          const {
            VAC,
            MAC,
            OAC,
            FlightNo,
            DepartureCode,
            ArrivalCode,
            DepartureTime,
            ArrivalTime
          } = seg.Flight;

          ownsetId = `${ownsetId}${VAC}_${FlightNo}_${DepartureCode}_${ArrivalCode}_${DepartureTime}_${ArrivalTime}`;

          if (segIndex != segments.length - 1) {
            ownsetId = ownsetId + '|';
          }

          const transFormedSegment: TransformedSegmentWithoutID = {
            origin: DepartureCode,
            destination: ArrivalCode,
            departure: moment
              .utc(DepartureTime, 'YYYY-MM-DDTHH:mm:ss')
              .format('YYYYMMDDHHmm'),
            arrival: moment
              .utc(ArrivalTime, 'YYYY-MM-DDTHH:mm:ss')
              .format('YYYYMMDDHHmm'),
            marketingCarrier: MAC,
            operatingCarrier: OAC,
            marketingFlightNumber: FlightNo,
            vehicleType: 'FLIGHT'
          };

          const segment = buildSegment(transFormedSegment);

          Segments.push(segment);
          transformedResult.segments[segment.id] = segment;
        });
        if (tripIndex === 0) {
          const Leg = buildLegFromSegments(Segments);
          Leg['ReturnIdentifier'] = leg.ReturnIdentifier;
          Leg['price'] = price;
          Leg['ownsetId'] = ownsetId;
          Leg['onIndx'] = leg.Index;
          Leg['deepLink'] = deepLink;
          outboundTrips.push(Leg);
          transformedResult.legs[Leg.id] = Leg;
        } else {
          const Leg = buildLegFromSegments(Segments);
          Leg['ReturnIdentifier'] = leg.ReturnIdentifier;
          Leg['price'] = price;
          Leg['rtnsetid'] = ownsetId;
          Leg['rtIndx'] = leg.Index;
          inboundTrips.push(Leg);
          transformedResult.legs[Leg.id] = Leg;
        }
      }
    });

    for (const outboundTrip of outboundTrips) {
      for (const inboundTrip of inboundTrips) {
        const deeplink =
          outboundTrip.deepLink +
          `&onIndex=${outboundTrip.onIndx}` +
          `&rtIndx=${inboundTrip.rtIndx}` +
          `&ownsetId=${outboundTrip.ownsetId}` +
          `&rtnsetid=${inboundTrip.rtnsetid}`;
        const itinerary = buildItineraryFromLegs([outboundTrip, inboundTrip]);
        const deepLinkPayload = encodeRedirectPayload({
          provider: providerName,
          agentId: agent.id,
          agentName: agent.name,
          url: deeplink
        });

        itinerary.pricingOptions = [
          {
            agent: agent.id,
            agentName: agent.name,
            deepLink: deepLinkPayload,
            price: {
              amount: parseFloat(outboundTrip.price + inboundTrip.price),
              currency: options.currency
            }
          }
        ];
        transformedResult.itineraries[itinerary.id] = itinerary;
      }
    }
  }

  return transformedResult;
};

export default roundTrip;
