import {
  buildItineraryFromTransferLegs,
  encodeRedirectPayload
} from '../../../../utils';

const providerName = 'kiwitaxi';
function transformResults(options: SearchTransfersOptions, data) {
  const transformedResult: TransformedTransferResult = {
    agents: {},
    legs: {},
    itineraries: {}
  };

  if (
    data.length == 0 ||
    data[0]['transfers'].length == 0 ||
    !data[0]['transfers']
  ) {
    return transformedResult;
  }

  const agent: IDictionary<string> = {
    id: Buffer.from(providerName).toString('base64'),
    name: providerName
  };
  transformedResult.agents[agent.id] = agent;

  const results = data[0]['transfers'];

  for (const trip of results) {
    let flag = false;
    const Legs: TransformedTransferLeg[] = [];
    const currency = trip.price.usd.currency.code;
    const price = trip.price.usd.cost;
    const car_type = trip.type.carExamples.en;
    const res = car_type.split(',');

    if (trip.type.pax >= options.adults + options.children + options.infants) {
      const leg = {
        id: trip.id,
        description: trip.type.description.en,

        viehcle_type: '',
        model: '',
        make: res[0].toLowerCase(),
        class: trip.type.name.en,
        time: data[0].timeinway,
        max_passengers: trip.type.pax,
        max_bags: trip.type.baggage,
        wait_time: trip.type.waiting_time,
        carImage_url: trip.type.photo3,

        free_cancellation:
          trip.restrictions.cancellationMinTime > 0 ? true : false,
        instruction_for_customer: ''
      };
      Legs.push(leg);
      transformedResult.legs[leg.id] = leg;
    } else {
      flag = true;
    }
    if (flag) {
      continue;
    }

    const itinery = buildItineraryFromTransferLegs(Legs);
    const deepLinkPayload = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url: trip.url.en
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
    } else {
      itinery.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          price: {
            amount: price * 2,
            currency: currency
          },
          deepLink: deepLinkPayload
        }
      ];
    }

    transformedResult.itineraries[itinery.id] = itinery;
  }
  if (Object.keys(transformedResult.itineraries).length === 0) {
    transformedResult.agents = {};
    transformedResult.legs = {};
    transformedResult.itineraries = {};
  }

  return transformedResult;
}
export default transformResults;
