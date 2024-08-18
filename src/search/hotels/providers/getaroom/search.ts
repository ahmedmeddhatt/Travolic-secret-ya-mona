import axios from 'axios';
import moment from 'moment';
import xml2js from 'xml2js';
import Hotel from '../../../../models/hotel';
import { City } from '../../../../models/city';
const parser = new xml2js.Parser();

function distributeGuests(
  numRooms: number,
  numAdults: number,
  numChildren: number
): number[][] {
  const adultsAge = '18';
  const childrenAge = '3';
  const rooms: number[][] = [];
  let remainingAdults = numAdults;
  let remainingChildren = numChildren;
  for (let i = 0; i < numRooms; i++) {
    let adultsInRoom = 0;
    let childrenInRoom = 0;
    if (remainingAdults >= numRooms - i) {
      adultsInRoom = Math.floor(remainingAdults / (numRooms - i));
      remainingAdults -= adultsInRoom;
    } else {
      adultsInRoom = remainingAdults;
      remainingAdults = 0;
    }
    if (remainingChildren >= numRooms - i) {
      childrenInRoom = Math.floor(remainingChildren / (numRooms - i));
      remainingChildren -= childrenInRoom;
    } else {
      childrenInRoom = remainingChildren;
      remainingChildren = 0;
    }
    rooms.push([Number(adultsAge), Number(childrenAge)]);
  }
  return rooms;
}

const search = async (input: SearchHotelOptions) => {
  const roomInfo = distributeGuests(input.rooms, input.adults, input.children);
  const rinfo = roomInfo.map((room) => {
    return room.map((passenger) => {
      return Number(passenger);
    });
  });

  const { GETAROOM_SEARCH_API, GETAROOM_API_KEY, GETAROOM_AUTH_TOKEN } =
    process.env;

  const check_in = moment(input.checkIn).format('MM/DD/YYYY');
  const check_out = moment(input.checkOut).format('MM/DD/YYYY');

  const city = await City.findOne({
    code: input.cityCode
  });

  if (!city) {
    return {};
  } else {
    const hotels = await Hotel.find({
      city_ref: city._id
    });

    const getAroomPropertiesId = hotels
      .filter((hotel) => hotel.getaroom_id)
      .map((hotel) => hotel.getaroom_id);

    const hotelsIdsChunks = [];
    const chunkSize = 99;
    for (let i = 0; i < getAroomPropertiesId.length; i += chunkSize) {
      hotelsIdsChunks.push(getAroomPropertiesId.slice(i, i + chunkSize));
    }

    //hotelsIdsChunks.push(['ea1a3cf3-34fa-457e-b986-9484dcdf9688']);

    const results = await Promise.allSettled(
      hotelsIdsChunks.map(async (propertyId) => {
        const response = await axios.post(
          `${GETAROOM_SEARCH_API}?api_key=${GETAROOM_API_KEY}&auth_token=${GETAROOM_AUTH_TOKEN}&rinfo=${JSON.stringify(
            rinfo
          )}&check_in=${check_in}&check_out=${check_out}&property_id[]=${propertyId.join(
            '&property_id[]='
          )}`,
          {
            headers: {
              'Content-type': 'application/x-www-form-urlencoded',
              'Accept-Encoding': 'gzip'
            }
          }
        );
        const hotels = await parser.parseStringPromise(response.data);
        return hotels;
      })
    );

    return results
      .filter(({ status }) => status === 'fulfilled')
      .map((result) => {
        if (result.status === 'fulfilled') {
          return result.value;
        }
      });
  }
};
export default search;
