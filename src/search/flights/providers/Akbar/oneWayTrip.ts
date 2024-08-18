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

const oneWayTrip = (
  transformedResult: TransformedResult,
  results: any,
  posData: any,
  options: SearchOptions,
  providerName: string,
  agent: IDictionary<string>
): TransformedResult => {
  for (const result of results) {
    if (!result.Trips) continue;

    const trips = result.Trips;

    for (const trip of trips) {
      const journey = trip.Journey;

      for (const legs of journey) {
        const segments = legs.Segments;
        const Legs: TransformedLeg[] = [];
        const Segments: TransformedSegment[] = [];

        let fromCity = segments[0].Flight.DepAirportName.split('|');
        fromCity = fromCity[1];
        let toCity =
          segments[segments.length - 1].Flight.ArrAirportName.split('|');
        toCity = toCity[1];
        const price = segments[0].Fares.NetFare;
        let ownsetId = '';

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

        const Leg = buildLegFromSegments(Segments);

        Legs.push(Leg);
        transformedResult.legs[Leg.id] = Leg;

        const deepLink = `${posData.deepLinkURL}?secType=DOM&srType=O&onIndx=${
          legs.Index
        }&rtIndx=&utl=${
          result.TUI
        }&fromCity=${fromCity}&toCity=${toCity}&from=${result.From}&to=${
          result.To
        }&owDt=${options.legs[0].departure}&rtDt=&adCnt=${
          options.adults
        }&chCnt=${options.children}&inCnt=${options.infants}&class=${
          cabinClassMap[options.cabinClass]
        }&ntAmt=${
          segments[0].Fares.NetFare
        }&isRsf=False&ownsetid=${ownsetId}&rtnsetid=&Travolic_redirectid=vtVdBjpBSPCmXBHEJDMrdw&utm_medium=flights_meta&utm_source=Travolic&utm_campaign=Travolic&process=flightselected`;

        const itinerary = buildItineraryFromLegs(Legs);
        const deepLinkPayload = encodeRedirectPayload({
          provider: providerName,
          agentId: agent.id,
          agentName: agent.name,
          url: deepLink
        });

        itinerary.pricingOptions = [
          {
            agent: agent.id,
            agentName: agent.name,
            deepLink: deepLinkPayload,
            price: {
              amount: parseFloat(price),
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

export default oneWayTrip;
