import {
  encodeRedirectPayload,
  buildItineraryFromTransferLegs
} from '../../../../utils/index';

const providerName = 'mozio';

const transformResults = (options: SearchTransfersOptions, data) => {
  const transformedResult: TransformedTransferResult = {
    agents: {},
    legs: {},
    itineraries: {}
  };

  if (!data['results'] || data['results'].length == 0) {
    return transformedResult;
  }

  const agent = {
    id: Buffer.from(providerName).toString('base64'),
    name: providerName
  };

  transformedResult.agents[agent.id] = agent;

  const { results, search_id } = data;

  for (const trip of results) {
    const price = trip.total_price.total_price.value;
    const currency = data['currency_info']['code'];
    const redirectUrl = `https://www.mozio.com/book?session_id=${search_id}&trip_id=${trip['result_id']}&ref=travolic&currency=${currency}`;
    const Legs: TransformedTransferLeg[] = [];

    let flag = false;
    if (options.tripType == 'oneway') {
      for (const ride of trip.steps) {
        if (
          ride.details.vehicle.max_passengers >
          options.adults + options.children + options.infants
        ) {
          const leg = {
            id: trip['vehicle_id'],
            description: ride['details']['description'],
            viehcle_type:
              ride['details']['vehicle']['vehicle_type']['name'].toLowerCase(),
            model: ride['details']['vehicle']['model'],
            make:
              ride['details']['vehicle']['make'] === null
                ? null
                : ride['details']['vehicle']['make'].toLowerCase(),
            time: ride['details']['time'],
            class:
              ride['details']['vehicle']['vehicle_class_detail'][
                'display_name'
              ],
            max_passengers: ride['details']['vehicle']['max_passengers'],
            max_bags: ride['details']['vehicle']['max_bags'],
            wait_time: ride['details']['wait_time']['minutes_included'],
            carImage_url: ride['details']['vehicle']['image'],
            departure_time: ride['details']['departure_datetime'],
            free_cancellation:
              ride['details']['cancellation']['cancellable_online'],
            review_count: ride.details.provider.rating_count,
            average_rating: ride.details.provider.rating,
            instruction_for_customer: '',
            supporter_providerName: ride['details']['provider']['display_name']
          };
          Legs.push(leg);
          transformedResult.legs[leg.id] = leg;
        } else {
          flag = true;
        }
      }
      if (flag) {
        continue;
      }

      const itinerary = buildItineraryFromTransferLegs(Legs);
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

      if (Object.keys(transformedResult.itineraries).length === 0) {
        transformedResult.agents = {};
        transformedResult.legs = {};
        transformedResult.itineraries = {};
      }
    } else {
      for (const ride of trip.steps) {
        if (
          ride.details.vehicle.max_passengers >
          options.adults + options.children + options.infants
        ) {
          const leg = {
            id: trip['vehicle_id'],
            description: ride['details']['description'],
            viehcle_type:
              ride['details']['vehicle']['vehicle_type']['name'].toLowerCase(),
            model: ride['details']['vehicle']['model'],
            make:
              ride['details']['vehicle']['make'] === null
                ? null
                : ride['details']['vehicle']['make'].toLowerCase(),
            time: ride['details']['time'],
            class:
              ride['details']['vehicle']['vehicle_class_detail'][
                'display_name'
              ],
            max_passengers: ride['details']['vehicle']['max_passengers'],
            max_bags: ride['details']['vehicle']['max_bags'],
            wait_time: ride['details']['wait_time']['minutes_included'],
            carImage_url: ride['details']['vehicle']['image'],
            departure_time: ride['details']['departure_datetime'],
            free_cancellation:
              ride['details']['cancellation']['cancellable_online'],
            review_count: ride.details.provider.rating_count,
            average_rating: ride.details.provider.rating,
            instruction_for_customer: '',
            supporter_providerName: ride['details']['provider']['display_name']
          };
          Legs.push(leg);
          transformedResult.legs[leg.id] = leg;
        } else {
          flag = true;
        }
      }
      for (const ride of trip.return_steps) {
        if (
          ride.details.vehicle.max_passengers >
          options.adults + options.children + options.infants
        ) {
          const leg = {
            id: trip['vehicle_id'] + '-return',
            description: ride['details']['description'],
            viehcle_type:
              ride['details']['vehicle']['vehicle_type']['name'].toLowerCase(),
            model: ride['details']['vehicle']['model'],
            make:
              ride['details']['vehicle']['make'] === null
                ? null
                : ride['details']['vehicle']['make'].toLowerCase(),
            time: ride['details']['time'],
            class:
              ride['details']['vehicle']['vehicle_class_detail'][
                'display_name'
              ],
            max_passengers: ride['details']['vehicle']['max_passengers'],
            max_bags: ride['details']['vehicle']['max_bags'],
            wait_time: ride['details']['wait_time']['minutes_included'],
            carImage_url: ride['details']['vehicle']['image'],
            departure_time: ride['details']['departure_datetime'],
            free_cancellation:
              ride['details']['cancellation']['cancellable_online'],
            review_count: ride.details.provider.rating_count,
            average_rating: ride.details.provider.rating,
            instruction_for_customer: '',
            supporter_providerName: ride['details']['provider']['display_name']
          };
          Legs.push(leg);
          transformedResult.legs[leg.id] = leg;
        } else {
          flag = true;
        }
      }
      if (flag) {
        continue;
      }
      const itinerary = buildItineraryFromTransferLegs(Legs);
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
    if (Object.keys(transformedResult.itineraries).length === 0) {
      transformedResult.agents = {};
      transformedResult.legs = {};
      transformedResult.itineraries = {};
    }
  }
  return transformedResult;
};
export default transformResults;
