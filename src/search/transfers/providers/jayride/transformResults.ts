import {
  buildItineraryFromTransferLegs,
  encodeRedirectPayload
} from '../../../../utils';

const providerName = 'jayride';

function transformResults(options: SearchTransfersOptions, data) {
  const transformedResult: TransformedTransferResult = {
    agents: {},
    legs: {},
    itineraries: {}
  };

  if (!data.results || data.results.quotes === 0) {
    return transformedResult;
  }
  const agent = {
    id: Buffer.from(providerName).toString('base64'),
    name: providerName
  };
  transformedResult.agents[agent.id] = agent;

  const results = data.results.quotes;

  let flag = false;

  for (const trip of results) {
    const Legs = [];
    const { price } = trip.fare;
    const currency = trip.fare.currency_code;
    const bag = trip.luggage.inclusive_allowance;
    const res = bag.split(' ');

    if (
      trip.service_info.max_pax >=
      options.adults + options.children + options.infants
    ) {
      const leg = {
        id: trip.quote_id,
        type: trip.service_info.type,
        description: trip.service_info.description,
        viehcle_type: trip.service_info.vehicle_type.toLowerCase(),
        model: '',
        make: '',
        class: trip.service_info.service_class,
        time: data.time,

        max_passengers: trip.service_info.max_pax,
        max_bags: res[0],

        carImage_url: trip.service_info.photo_url,

        departure_time:
          data.quote_request.flight.departure_datetime_local == null
            ? data.quote_request.flight.landing_datetime_local
            : data.quote_request.flight.departure_datetime_local,

        free_cancellation:
          trip.fare.refund_policies[0].method === 'refund' ? true : false,

        review_count: trip.service_info.passenger_reviews.count,

        average_rating: trip.service_info.passenger_reviews.average_rating,
        supporter_providerName: trip.service_info.supplier.name,
        Domestic_Airport_Arrival_Private: '30 mins wait time',
        Domestic_Airport_Arrival_Ride_Hail: '5 mins (Call upon arrival)',
        Domestic_Airport_Arrival_Shared_Shuttle:
          'Have buses running every 30 mins to an hour. If you miss the service, catch the next available shuttle.',
        Domestic_Airport_departure_Private: '10 mins wait time',
        Domestic_Airport_departure_Ride_Hail: '5 mins (Call upon arrival)',
        Domestic_Airport_departure_Shared_Shuttle:
          'No wait time, be out the front ready',
        International_Airport_Arrival_Private: ' 60 mins wait time',
        International_Airport_Arrival_Ride_Hail:
          ' 5 mins  (You will be notified when driver is out the front)',
        International_Airport_Arrival_Shared_Shuttle:
          'Have buses running every 30 mins to an hour. If you miss the service, catch the next available shuttle.',
        International_Airport_departure_Private: '10 mins wait time',
        International_Airport_departure_Ride_Hail:
          '5 mins (You will be notified when driver is out the front)',
        International_Airport_departure_Shared_Shuttle:
          'No wait time, be out the front ready'
      };

      Legs.push(leg);
      transformedResult.legs[leg.id] = leg;
    } else {
      flag = true;
    }
    if (flag) {
      continue;
    }

    const itinerary = buildItineraryFromTransferLegs(Legs);
    const deepLinkPayload = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url: trip.book_url + '&currency=' + options.currency
    });
    itinerary.pricingOptions = [
      {
        agent: agent.id,
        agentName: agent.name,
        price: {
          amount: price,
          currency: currency
        },
        deepLink: deepLinkPayload
      }
    ];

    transformedResult.itineraries[itinerary.id] = itinerary;
  }

  if (Object.keys(transformedResult.itineraries).length === 0) {
    transformedResult.agents = {};
    transformedResult.legs = {};
    transformedResult.itineraries = {};
  }

  return transformedResult;
}
export default transformResults;
