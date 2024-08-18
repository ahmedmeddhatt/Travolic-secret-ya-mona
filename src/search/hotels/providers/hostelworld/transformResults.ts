import moment from 'moment';
import { encodeRedirectPayload } from '../../../../utils';
const providerName = 'Hostelworld';

const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const transformResults = (input: SearchHotelOptions, data: any) => {
  const transformedResults: TransformedHotelResult = {
    agents: {},
    data: {}
  };

  transformedResults.agents[agent.id] = agent;

  if (
    !data['result']['Properties'] ||
    Object.keys(data['result']['Properties']).length === 0
  ) {
    transformedResults['error'] = 'No results found';
  }

  for (const item of data['result']['Properties']) {
    for (const room of item['roomTypes']) {
      const { checkoutLink, roomId, total } = room;

      const { number, address1, type, name, avgRating, numReviews, images } =
        item;

      const imageUrl = images[0]['url'];
      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: checkoutLink
      });
      const pricingOptionsData = [
        {
          agent: agent.id,
          agentName: agent.name,
          price: {
            amount: parseFloat(total.price[input.currency]),
            currency: input.currency
          },
          deepLink: deepLinkPayload
        }
      ];

      const items: TransformedHotelDetails = {
        hotelId: number,
        hostelName: name,
        hostelAddress: address1,
        checkIn: moment(input.checkIn).format('YYYYMMDD'),
        checkOut: moment(input.checkOut).format('YYYYMMDD'),
        roomType: type,
        roomId: roomId,
        houseType: type,
        pricingOptions: pricingOptionsData,
        reviewsCount: numReviews,
        rating: avgRating,
        images: imageUrl
      };
      transformedResults.data[
        `${items.checkIn}-${items.checkOut}-${items.hotelId}`
      ] = items;
    }
  }
  return transformedResults;
};

export default transformResults;
