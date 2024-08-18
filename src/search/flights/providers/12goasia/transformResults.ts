import moment from 'moment';

import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

const providerName = 'goAsia';
const agent: IDictionary<string> = {
  id: Buffer.from(providerName).toString('base64'),
  name: '12Go Asia'
};

const transformResults = (
  options: SearchOptions,
  data: any
): TransformedResult => {
  const transformedResult: TransformedResult = {
    agents: {},
    legs: {},
    itineraries: {},
    segments: {}
  };

  if (
    Object.keys(data).length === 0 ||
    typeof data.response === 'undefined' ||
    data.response.length === 0
  ) {
    transformedResult['error'] = 'No data found';
    return transformedResult;
  }

  const results = data.response;

  if (options.tripType === 'round') {
    if (results.length === 2) {
      if (results[0].length == 0 || results[1].length == 0) {
        transformedResult['error'] = 'No data found';
        return transformedResult;
      }

      transformedResult.agents[agent.id] = agent;

      const currency = results[0][0].trips[0].travel_options[0].price.fxcode;
      const Legs: TransformedLeg[] = [];
      const LegsOutbound: TransformedLeg[] = [];
      const LegsInbound: TransformedLeg[] = [];

      for (const result of results[0]) {
        const { trips, stations, operators } = result;
        for (const trip of trips) {
          const Segments: TransformedSegment[] = [];
          const price = trip.travel_options[0].price.value;
          const tripID = trip.travel_options[0].buy[0].trip_id;
          const tripDate = trip.travel_options[0].buy[0].date;

          for (let index = 0; index < trip.segments.length; index++) {
            if (trip.segments[index].type === 'route') {
              const { from, to, dep_time, arr_time, operator, official_id } =
                trip.segments[index];
              const transformedSegmentWithoutId: TransformedSegmentWithoutID = {
                origin: stations[from].station_code,
                destination: stations[to].station_code,
                departure: moment
                  .utc(dep_time, 'YYYY-MM-DD HH:mm:ss')
                  .format('YYYYMMDDHHmm'),
                arrival: moment
                  .utc(arr_time, 'YYYY-MM-DD HH:mm:ss')
                  .format('YYYYMMDDHHmm'),
                marketingCarrier: operators[operator].code,
                operatingCarrier: operators[operator].code,
                marketingFlightNumber: official_id.substring(2),
                vehicleType: 'FLIGHT'
              };
              const segment = buildSegment(transformedSegmentWithoutId);

              Segments.push(segment);
              transformedResult.segments[segment.id] = segment;
            }
          }

          if (Segments.length > 0) {
            const Leg = buildLegFromSegments(Segments);

            Legs.push(Leg);
            LegsOutbound.push(Leg);
            Leg['trip-id'] = tripID;
            Leg['trip-date'] = tripDate;
            Leg['price'] = price;
            transformedResult.legs[Leg.id] = Leg;
          }
        }
      }

      for (const result of results[1]) {
        const { trips, stations, operators } = result;
        for (const trip of trips) {
          const Segments: TransformedSegment[] = [];
          const price = trip.travel_options[0].price.value;
          const tripID = trip.travel_options[0].buy[0].trip_id;
          const tripDate = trip.travel_options[0].buy[0].date;

          for (let index = 0; index < trip.segments.length; index++) {
            if (trip.segments[index].type === 'route') {
              const { from, to, dep_time, arr_time, operator, official_id } =
                trip.segments[index];
              const transformedSegmentWithoutId: TransformedSegmentWithoutID = {
                origin: stations[from].station_code,
                destination: stations[to].station_code,
                departure: moment
                  .utc(dep_time, 'YYYY-MM-DD HH:mm:ss')
                  .format('YYYYMMDDHHmm'),
                arrival: moment
                  .utc(arr_time, 'YYYY-MM-DD HH:mm:ss')
                  .format('YYYYMMDDHHmm'),
                marketingCarrier: operators[operator].code,
                operatingCarrier: operators[operator].code,
                marketingFlightNumber: official_id.substring(2),
                vehicleType: 'FLIGHT'
              };
              const segment = buildSegment(transformedSegmentWithoutId);

              Segments.push(segment);
              transformedResult.segments[segment.id] = segment;
            }
          }

          if (Segments.length > 0) {
            const Leg = buildLegFromSegments(Segments);

            Legs.push(Leg);
            LegsInbound.push(Leg);
            Leg['trip-id'] = tripID;
            Leg['trip-date'] = tripDate;
            Leg['price'] = price;
            transformedResult.legs[Leg.id] = Leg;
          }
        }
      }

      for (const outbound of LegsOutbound) {
        for (const inbound of LegsInbound) {
          const itinerary = buildItineraryFromLegs([outbound, inbound]);
          const deepLinkPayload = encodeRedirectPayload({
            provider: providerName,
            agentId: agent.id,
            agentName: agent.name,
            url: `https://recheck10.12go.co/api/v1/cart/${
              outbound['trip-id']
            }/${outbound['trip-date']}/${inbound['trip-id']}/${
              inbound['trip-date']
            }?people=${
              options.adults + options.children
            }&k=334c39e0b01abfb68853ea7ebe49f285`
          });
          itinerary.pricingOptions = [
            {
              agent: agent.id,
              agentName: agent.name,
              deepLink: deepLinkPayload,
              price: {
                amount:
                  parseFloat(outbound['price'].toString()) +
                  parseFloat(inbound['price'].toString()),
                currency: currency
              }
            }
          ];
          transformedResult.itineraries[itinerary.id] = itinerary;
        }
      }
    }
  } else if (options.tripType === 'oneway') {
    transformedResult.agents[agent.id] = agent;

    const { trips, stations, operators } = results[0][0];

    if (trips.length === 0) {
      transformedResult['error'] = 'No trips found';
      return transformedResult;
    }
    // return transformedResult;
    for (const trip of trips) {
      const currency = trip.travel_options[0].price.fxcode;
      const price = trip.travel_options[0].price.value;
      const tripID = trip.travel_options[0].buy[0].trip_id;
      const tripDate = trip.travel_options[0].buy[0].date;
      const redirectUrl = `https://recheck10.12go.co/api/v1/cart/${tripID}/${tripDate}?people=${
        options.adults + options.children
      }&k=334c39e0b01abfb68853ea7ebe49f285`;
      // const amenities = trip.travel_options[0].amenities;
      const Legs: TransformedLeg[] = [];
      const Segments: TransformedSegment[] = [];

      for (let index = 0; index < trip.segments.length; index++) {
        if (trip.segments[index].type === 'route') {
          const { from, to, dep_time, arr_time, operator, official_id } =
            trip.segments[index];
          const transformedSegmentWithoutId: TransformedSegmentWithoutID = {
            origin: stations[from].station_code,
            destination: stations[to].station_code,
            departure: moment
              .utc(dep_time, 'YYYY-MM-DD HH:mm:ss')
              .format('YYYYMMDDHHmm'),
            arrival: moment
              .utc(arr_time, 'YYYY-MM-DD HH:mm:ss')
              .format('YYYYMMDDHHmm'),
            marketingCarrier: operators[operator].code,
            operatingCarrier: operators[operator].code,
            marketingFlightNumber: official_id.substring(2)
          };
          const segment = buildSegment(transformedSegmentWithoutId);

          Segments.push(segment);
          transformedResult.segments[segment.id] = segment;
        }
      }

      if (Segments.length > 0) {
        const Leg = buildLegFromSegments(Segments);

        Legs.push(Leg);
        transformedResult.legs[Leg.id] = Leg;

        const itinerary = buildItineraryFromLegs(Legs);
        const deepLinkPayload = encodeRedirectPayload({
          provider: providerName,
          agentId: agent.id,
          agentName: agent.name,
          url: redirectUrl
        });
        itinerary.pricingOptions = [
          {
            agent: agent.id,
            agentName: agent.name,
            deepLink: deepLinkPayload,
            price: {
              amount: parseFloat(price),
              currency: currency
            }
          }
        ];
        transformedResult.itineraries[itinerary.id] = itinerary;
      }
    }
  } else {
    transformedResult['error'] = 'No data found';
  }

  if (Object.keys(transformedResult.itineraries).length === 0) {
    transformedResult['error'] = 'No data found';
  }

  return transformedResult;
};
export default transformResults;
