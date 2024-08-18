import moment from 'moment';
import { encodeRedirectPayload } from '../../../../utils';

const providerName = 'getaroom';

const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: 'Getaroom'
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

  transformedResults.agents[agent.id] = agent;

  if (!data || Object.keys(data).length === 0) {
    transformedResults['error'] = 'No results found';
  }

  for (const result of Object.values(data)) {
    for (const stay of Object.values(result['room-stays']['room-stay'] || {})) {
      const hotelRestrictionsBegin =
        stay['restrictions'][0]['booking-begin-at'];
      const hotelRestrictionsEnd = stay['restrictions'][0]['booking-end-at'];
      const landingUrl = stay['landing-url'].join(' ');
      const hotelRateToken = stay['rate-token'].join(' ');
      for (const price of Object.values(stay['booking-pricing'] || {})) {
        const avgNightLyRate = price['lowest-average'].join(' ');
        const roomTotal = price['total'].join(' ');
        const currency = price['currency'].join(' ');

        const deepLinkPayload = encodeRedirectPayload({
          provider: providerName,
          agentId: agent.id,
          agentName: agent.name,
          url: landingUrl
        });

        for (const roomInfo of Object.values(stay['room'] || {})) {
          const hotel_id = dumpHotels['426']['giataId'];
          // const hotel_id = roomInfo['hotel-id'].join(' ');
          const room_id = roomInfo['room-id'].join(' ');
          const room_type = roomInfo['title'][0]['_'];
          const pricingOptionsData = [
            {
              agent: agent.id,
              agentName: agent.name,
              price: {
                amount: parseFloat(roomTotal),
                currency: currency
              },
              deepLink: deepLinkPayload
            }
          ];

          const items: TransformedHotelDetails = {
            hotelId: hotel_id,
            checkIn: moment(input.checkIn).format('YYYYMMDD'),
            checkOut: moment(input.checkOut).format('YYYYMMDD'),
            roomType: room_type,
            roomId: room_id,
            pricingOptions: pricingOptionsData,
            restrictions: {
              bookingBeginAt: hotelRestrictionsBegin,
              bookingEndAt: hotelRestrictionsEnd
            },
            facilities: {},
            avgNightLyPrice: avgNightLyRate,
            stars: undefined,
            amenities: {},
            images: undefined,
            rating: hotelRateToken
          };

          transformedResults.data[
            `${items.hotelId}-${items.checkIn}-${items.checkOut}`
          ] = items;
        }
      }
    }
  }
  return transformedResults;
};

export default transformResults;
