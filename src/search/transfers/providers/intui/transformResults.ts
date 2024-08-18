import {
  encodeRedirectPayload,
  buildItineraryFromTransferLegs
} from '../../../../utils';

const providerName = 'intui';

function transformResults(options: SearchTransfersOptions, data) {
  const transformedResult: TransformedTransferResult = {
    agents: {},
    legs: {},
    itineraries: {}
  };

  if (
    !data ||
    !data['response'] ||
    data['response'].length == 0 ||
    !Object.values(data['response'])
  ) {
    return transformedResult;
  }

  const agent = {
    id: Buffer.from(providerName).toString('base64'),
    name: providerName
  };

  transformedResult.agents[agent.id] = agent;
  let flag = false;
  const results = Object.values(data['response']);

  for (const result of results) {
    if (result['returning']) {
      result['travelling'] = result['returning'];
      delete result['returning'];
    }
    const trips = result['travelling'];

    trips?.forEach((trip) => {
      const Legs: TransformedTransferLeg[] = [];
      const { allprice } = trip.pricing;
      const price = allprice[options.currency]
        ? allprice[options.currency]
        : allprice['EUR'];
      const currency = allprice[options.currency] ? options.currency : 'EUR';

      const redirectUrl = trip['info']['IntuiUrlOrderSingle'];

      if (
        trip.info.maxpax >=
        options.adults + options.children + options.infants
      ) {
        const leg = {
          id: trip['info']['vehicleid'],
          description: trip['info']['vehicle_description'],
          viehcle_type: trip['info']['type_vehicle'].toLowerCase(),
          model: '',
          make: '',
          time: trip['info']['transfertime'],
          class: trip['info']['vehicle_class'],

          max_passengers: trip.info.maxpax,

          max_bags: trip['info']['luggage'],
          wait_time: trip['conditions']['maximum_waiting_time'],
          carImage_url: trip['info']['CarImgUrl'],
          departure_time: '',
          free_cancellation:
            trip['info']['free_cancellation'] == 0 ? false : true,
          average_rating:
            trip.info.EvaluationReviews == 'NA'
              ? 'NA'
              : trip.info.EvaluationReviews,
          instruction_for_customer: trip.conditions.instruction
        };
        Legs.push(leg);
        transformedResult.legs[leg.id] = leg;
      } else {
        flag = true;
      }

      if (flag) {
        return;
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
    });
  }

  if (Object.keys(transformedResult.itineraries).length === 0) {
    transformedResult.agents = {};
    transformedResult.legs = {};
    transformedResult.itineraries = {};
  }

  return transformedResult;
}
export default transformResults;
