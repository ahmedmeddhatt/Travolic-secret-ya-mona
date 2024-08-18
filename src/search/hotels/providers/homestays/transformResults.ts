import moment from 'moment';
import { encodeRedirectPayload } from '../../../../utils';
const providerName = 'homeStays';

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

  if (!data || Object.keys(data).length === 0) {
    transformedResults['error'] = 'No results found';
  }

  for (const item of data.data) {
    for (const pic of item['pictures']) {
      const imageUrl = pic['url'];
      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: item['url']
      });

      const pricingOptionsData = [
        {
          agent: agent.id,
          agentName: agent.name,
          price: {
            amount: parseFloat(item['minimum_price_per_night']),
            currency: item['currency_code']
          },
          deepLink: deepLinkPayload
        }
      ];

      const meals_provided = Object.keys(item['meals_provided'])
        .filter((key) => item['meals_provided'][key])
        .reduce((obj, key) => {
          obj[key] = item['meals_provided'][key];
          return obj;
        }, {});

      const items: TransformedHotelDetails = {
        hotelId: item['id'].toString(),
        checkIn: moment(input.checkIn).format('YYYYMMDD'),
        checkOut: moment(input.checkOut).format('YYYYMMDD'),
        roomType: item['rooms'][0]['type'],
        roomId: item['rooms'][0]['id'].toString(),
        houseType: item['house_type'],
        pricingOptions: pricingOptionsData,
        restrictions: {},
        facilities: item['house_facilities'],
        amenities: {
          amenities: item['amenities'],
          mealsProvided: meals_provided
        },
        avgNightLyPrice: item['rates'].nightly,
        stars: item['review_rating'],
        rating: item['rates'],
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
