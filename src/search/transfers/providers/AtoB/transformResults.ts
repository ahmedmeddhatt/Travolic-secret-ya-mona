import {
  encodeRedirectPayload,
  buildItineraryFromTransferLegs
} from '../../../../utils';

const providerName = 'AtoB';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

function transformResults(options: SearchTransfersOptions, data) {
  const transformedResult: TransformedTransferResult = {
    agents: {},
    legs: {},
    itineraries: {}
  };

  function splitAtIndex(str, index) {
    const firstPart = str.slice(0, index);
    const secondPart = str.slice(index);

    return [firstPart, secondPart];
  }

  if (!data || Object.keys(data).length == 0 || !data['vehicles']) {
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;
  const results = data['vehicles']['outward'];
  let index = 0;
  for (const trip of results) {
    const Legs: TransformedTransferLeg[] = [];
    const { currency } = options;
    const price_parts = splitAtIndex(trip.price.toString(), -2);
    const price = parseFloat(price_parts[0] + '.' + price_parts[1]);

    const leg = {
      id: index.toString(),
      description: trip.description,
      class: trip.class,
      viehcle_type: '',
      make: trip.description,
      max_passengers: trip.max_passengers,
      max_bags: trip.max_luggage,
      carImage_url: trip.image
    };

    let trip_duration = trip.duration;
    if (options.tripType === 'round') {
      trip_duration += data['vehicles']['return'][index].duration;
    }

    leg['time'] = Math.ceil(trip_duration / 60);

    Legs.push(leg);
    transformedResult.legs[leg.id] = leg;

    const itinery = buildItineraryFromTransferLegs(Legs);
    const deepLinkPayload = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url: trip.url
    });
    if (options.tripType == 'oneway') {
      itinery.pricingOptions = [
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
    } else if (options.tripType === 'round') {
      const return_price_parts = splitAtIndex(
        data['vehicles']['return'][index].price.toString(),
        -2
      );
      const return_price = parseFloat(
        return_price_parts[0] + '.' + return_price_parts[1]
      );
      itinery.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          price: {
            amount: price + return_price,
            currency: currency
          },
          deepLink: deepLinkPayload
        }
      ];
    }

    transformedResult.itineraries[itinery.id] = itinery;
    index++;
  }

  if (Object.keys(transformedResult.itineraries).length === 0) {
    transformedResult.agents = {};
    transformedResult.legs = {};
    transformedResult.itineraries = {};
  }

  return transformedResult;
}
export default transformResults;
