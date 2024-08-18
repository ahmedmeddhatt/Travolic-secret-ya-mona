import moment from 'moment';
import { trackHotelSearch } from './track';

export const hotelSearchTracking = async (
  searchId: string,
  options: HotelsTrackingSearchOptions
) => {
  const trackData = {
    checkIn: options.checkIn,
    checkOut: options.checkOut,
    userData: options.userData,
    device: {
      os: options.deviceInfo,
      type: options.deviceType,
      platform: options.devicePlatform,
      platformName: options.devicePlatformName,
      version: options.deviceVersion
    },
    source: options.source,
    timestamp: moment.utc().format(),
    visitorId: options.visitorId ?? undefined,
    currency: options.currency,
    guests: {
      adults: options.adults,
      children: options.children,
      infants: options.infants ?? 0
    },
    language: options.language ?? undefined,
    roomsCount: options.rooms ?? undefined,
    countryCode: options.countryCode ?? undefined,
    country: options.country ?? undefined,
    // isCity: options.isCity ?? undefined,
    city: options.city ?? undefined,
    cityCode: options.cityCode ?? undefined,
    // cityId: options.cityId ?? undefined,
    hotelName: options.hotelName ?? undefined,
    // hotelId: options.hotelId ?? undefined,
    nightsCount: moment(moment(options.checkOut).format('YYYY-MM-DD')).diff(
      moment(options.checkIn).format('YYYY-MM-DD'),
      'days'
    )
  };

  trackHotelSearch(searchId, trackData);
};
