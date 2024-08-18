import moment from 'moment';
import queryString from 'query-string';
import {
  buildItineraryFromTransferLegs,
  encodeRedirectPayload
} from '../../../../utils';

const providerName = 'gettransfer';
const transformResults = (
  options: SearchTransfersOptions,
  data
): TransformedTransferResult => {
  const transformedResult: TransformedTransferResult = {
    agents: {},
    legs: {},
    itineraries: {}
  };

  if (!data || !data.data) {
    return transformedResult;
  }

  const { offers } = data.data;

  const agent: IDictionary<string> = {
    id: Buffer.from(providerName).toString('base64'),
    name: providerName
  };
  transformedResult.agents[agent.id] = agent;

  for (const offer of offers) {
    const leg = buildLegFromOffer(offer);
    transformedResult.legs[leg.id] = leg;
    const itinerary = buildItineraryFromTransferLegs([leg]);
    const deepLinkPayload = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url: make_url(options)
    });
    itinerary.pricingOptions = [
      {
        agent: agent.id,
        agentName: agent.name,
        price: {
          amount: offer.price.amount,
          currency: offer.price.currency
        },
        deepLink: deepLinkPayload
      }
    ];
    transformedResult.itineraries[itinerary.id] = itinerary;
  }

  return transformedResult;
};

const buildLegFromOffer = (offer: any): TransformedTransferLeg => {
  const { vehicle, carrier } = offer;
  return {
    description: '',
    id: `${vehicle.id}`,
    model: vehicle.model,
    max_passengers: vehicle.pax_max,
    max_bags: vehicle.luggage_max,
    average_rating: carrier.ratings.average,
    carImage_url:
      vehicle.photos.length > 0
        ? `https://gtrbox.org/${vehicle.photos[0]}`
        : undefined,
    make: vehicle.brand_name,
    free_cancellation: offer.refund_tariffs.length > 0 ? true : false //TODO:get back to the refund tarrifs
  };
};

const make_url = (options: SearchTransfersOptions) => {
  const { tripType, legs } = options;
  const query = queryString.stringify({
    'transfer[from][name]': legs[0].origin,
    'transfer[from][point]': `(${legs[0].start_lat},${legs[0].start_long})`,
    'transfer[to][name]': legs[0].destination,
    'transfer[to][point]': `(${legs[0].end_lat},${legs[0].end_long})`,
    'transfer[trip_to][date]':
      moment(legs[0].departure, 'YYYY-MM-DD').format('YYYY/MM/DD') +
      ` ${legs[0].time}`,
    'transfer[trip_return][date]':
      tripType === 'round'
        ? moment(legs[1].departure, 'YYYY-MM-DD').format('YYYY/MM/DD') +
          ` ${legs[1].time}`
        : '',
    'utm_campaign ': '',
    utm_source: '',
    utm_medium: ''
    //TODO: ask maxim for the number of passengers options and the utm variables
  });
  return `https://gettransfer.com/transfers/new?${query}`;
};

export default transformResults;
