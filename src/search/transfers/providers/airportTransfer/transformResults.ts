import {
  buildItineraryFromTransferLegs,
  encodeRedirectPayload
} from '../../../../utils';

const providerName = 'AirportTransfer';
function transformResults(options: SearchTransfersOptions, data) {
  const transformedResult: TransformedTransferResult = {
    agents: {},
    legs: {},
    itineraries: {}
  };
  if (!data.vehicles || data.vehicles.length === 0) {
    return transformedResult;
  }

  const agent: IDictionary<string> = {
    id: Buffer.from(providerName).toString('base64'),
    name: providerName
  };
  transformedResult.agents[agent.id] = agent;

  const { vehicles } = data;

  for (const vehicle of vehicles) {
    const Legs: TransformedTransferLeg[] = [];
    const { price, currency } = vehicle;

    const leg = {
      id: vehicle.id,
      description: ' ',
      viehcle_type: vehicle.type.toLowerCase(),
      model: vehicle.model,
      make: vehicle.make.toLowerCase(),
      time: data.time,
      max_passengers: vehicle.max_passengers,
      max_bags: vehicle.suitcase,
      carImage_url: vehicle.image,
      supporter_providerName: vehicle.company.name
    };

    Legs.push(leg);
    transformedResult.legs[leg.id] = leg;

    const itinerary = buildItineraryFromTransferLegs(Legs);

    const deepLinkToken = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      searchID: data.searchID,
      vehicle_id: vehicle.id
    });

    itinerary.pricingOptions = [
      {
        agent: agent.id,
        agentName: agent.name,
        price: {
          amount: price,
          currency: currency
        },
        deepLink: deepLinkToken
      }
    ];
    transformedResult.itineraries[itinerary.id] = itinerary;
  }

  return transformedResult;
}
export default transformResults;
