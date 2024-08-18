import axios from 'axios';
import moment from 'moment';
import logger from '../../../../configs/logger';

const search = async (input: SearchHotelOptions) => {
  const hotelsIds = [];
  input.hotelsData.forEach((hotel) => {
    if (
      hotel.providerCodes &&
      hotel.providerCodes.agoda &&
      hotel.providerCodes.agoda[0]
    ) {
      hotelsIds.push(parseInt(hotel.providerCodes.agoda[0]));
    }
  });

  const searchData = {
    criteria: {
      additional: {
        currency: input.currency,
        discountOnly: false,
        language: 'en-us',
        occupancy: {
          numberOfAdult: input.adults,
          numberOfChildren: input.children
        }
      },
      checkInDate: moment(input.checkIn).format('YYYY-MM-DD'),
      checkOutDate: moment(input.checkOut).format('YYYY-MM-DD'),
      hotelId: hotelsIds
    }
  };

  try {
    const results = await axios.post(
      'https://affiliateapi7643.agoda.com/affiliateservice/lt_v1',
      JSON.stringify(searchData),
      {
        headers: {
          'Content-type': 'application/json',
          Authorization: '1836527:52bf74a8-db9b-411b-acc3-5ff9c97472f4'
        }
      }
    );

    //console.log(results.data);

    return results.data;
  } catch (err) {
    logger.error(err.response.data);
    return {};
  }
  // if (input.type === 'city') {
  //   const searchData = {
  //     criteria: {
  //       additional: {
  //         currency: input.currency,
  //         dailyRate: {
  //           maximum: 100000,
  //           minimum: 0
  //         },
  //         discountOnly: false,
  //         language: 'en-us',
  //         maxResult: 10000,
  //         minimumReviewScore: 0,
  //         minimumStarRating: 0,
  //         occupancy: {
  //           numberOfAdult: input.adults,
  //           numberOfChildren: input.children
  //         },
  //         sortBy: 'PriceAsc'
  //       },
  //       checkInDate: moment(input.checkIn).format('YYYY-MM-DD'),
  //       checkOutDate: moment(input.checkOut).format('YYYY-MM-DD'),
  //       cityId: parseInt(input.hotelsData[0])
  //     }
  //   };
  //   try {
  //     const results = await axios.post(
  //       'https://affiliateapi7643.agoda.com/affiliateservice/lt_v1',
  //       JSON.stringify(searchData),
  //       {
  //         headers: {
  //           'Content-type': 'application/json',
  //           Authorization: '1836527:52bf74a8-db9b-411b-acc3-5ff9c97472f4'
  //         }
  //       }
  //     );
  //     return results.data;
  //   } catch (err) {
  //     logger.error(err.response.data);
  //     return {};
  //   }
  // } else {
  //   const searchData = {
  //     criteria: {
  //       additional: {
  //         currency: input.currency,
  //         discountOnly: false,
  //         language: 'en-us',
  //         occupancy: {
  //           numberOfAdult: input.adults,
  //           numberOfChildren: input.children
  //         }
  //       },
  //       checkInDate: moment(input.checkIn).format('YYYY-MM-DD'),
  //       checkOutDate: moment(input.checkOut).format('YYYY-MM-DD'),
  //       hotelId: [parseInt(input.hotelsData[0])]
  //     }
  //   };

  //   try {
  //     const results = await axios.post(
  //       'https://affiliateapi7643.agoda.com/affiliateservice/lt_v1',
  //       JSON.stringify(searchData),
  //       {
  //         headers: {
  //           'Content-type': 'application/json',
  //           Authorization: '1836527:52bf74a8-db9b-411b-acc3-5ff9c97472f4'
  //         }
  //       }
  //     );
  //     return results.data;
  //   } catch (err) {
  //     logger.error(err.response.data);
  //     return {};
  //   }
  // }
};

export default search;
