import axios from 'axios';
import moment from 'moment';
import querystring from 'query-string';

const { consumer_key, consumer_signature } = process.env;

const search = async (input: SearchHotelOptions) => {
  const DateStart = moment(input.checkIn).format('YYYY-MM-DD');
  const DateEnd = moment(input.checkOut).format('YYYY-MM-DD');
  const { adults, children, infants } = input;
  const guests = adults + children + infants;
  const Country = input.country;
  const City = input.city;
  const Currency = input.currency;
  const requestUrl =
    'https://partner-api.hostelworld.com/propertylocationsearch.json';
  const payload = {
    consumer_key,
    consumer_signature,
    DateStart,
    DateEnd,
    City,
    Country,
    Currency
  };
  const headers = { accept: 'application/json' };

  try {
    const { data: searchResult } = await axios.get(
      `${requestUrl}?${querystring.stringify(
        payload
      )}&showPosition=true&showReviewCount=true&SortBy=price&ShowRoomTypeInfo=8258`,
      { headers }
    );

    const requestPropertyLinkUrl =
      'https://partner-api.hostelworld.com/propertylinks.json';

    const propertyLinks = await Promise.all(
      searchResult.result.Properties.flatMap((property) =>
        property.roomTypes.map(async ({ roomId, ratePlanId }) => {
          const { data: propertyLinkResult } = await axios.get(
            `${requestPropertyLinkUrl}?${querystring.stringify({
              ...payload,
              PropertyNumbers: property.number,
              RoomId1: roomId,
              RatePlanId1: ratePlanId,
              Persons1: guests
            })}`,
            { headers }
          );
          return propertyLinkResult;
        })
      )
    );
    searchResult.result.Properties.forEach((property) => {
      property.roomTypes.forEach((room) => {
        const propertyLink = propertyLinks.find(
          (link) =>
            link['result']['properties'][0].propertyNumber === property.number
        );

        if (propertyLink && propertyLink.result.properties[0].links.checkout) {
          room['checkoutLink'] =
            propertyLink.result.properties[0].links.checkout;
        }
      });
    });

    return searchResult;
  } catch (error) {
    return [];
  }
};

export default search;
