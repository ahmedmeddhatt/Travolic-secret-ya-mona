import moment from 'moment';
import { encodeRedirectPayload } from '../../../../utils';

const providerName = 'agoda';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: 'Agoda'
};
const transformResults = async (
  input: SearchHotelOptions,
  interceptedData: any
): Promise<TransformedHotelResult> => {
  const { data, hotelsData, dumpHotels } = interceptedData;
  const transformedResults: TransformedHotelResult = {
    agents: {},
    data: {},
    hotels: hotelsData
  };
  if (
    !data.results ||
    data.results.length === 0 ||
    Object.keys(data).length === 0
  ) {
    transformedResults['error'] = 'No results found';
    return transformedResults;
  }

  transformedResults.agents[agent.id] = agent;
  for (const result of data.results) {
    const {
      hotelId,
      roomtypeName,
      starRating,
      freeWifi,
      includeBreakfast,
      // reviewScore,
      imageURL,
      dailyRate,
      currency
    } = result;

    const item: TransformedHotelDetails = {
      hotelId: dumpHotels[hotelId]['giataId'],
      checkIn: moment(input.checkIn).format('YYYYMMDD'),
      checkOut: moment(input.checkOut).format('YYYYMMDD'),
      roomType: roomtypeName,
      stars: starRating,
      pricingOptions: undefined,
      amenities: {
        wifi: freeWifi,
        breakfast: includeBreakfast
      },
      rating: dumpHotels[hotelId]['ratings'],
      images: imageURL
    };

    const deepLinkPayload = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url: result.landingURL
    });

    item.pricingOptions = [
      {
        agent: agent.id,
        agentName: agent.name,
        price: {
          amount: parseFloat(dailyRate),
          currency: currency
        },
        deepLink: deepLinkPayload
      }
    ];
    transformedResults.data[
      `${item.hotelId}-${item.checkIn}-${item.checkOut}`
    ] = item;
  }

  return transformedResults;
};

export default transformResults;
