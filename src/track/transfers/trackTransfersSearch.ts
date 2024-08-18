import moment from 'moment';
import { trackTransferSearch } from './track';

export const transferSearchTracking = async (
  searchId: string,
  options: any
) => {
  const timestamp = moment.utc().format();

  const legs = await Promise.all(
    options.legs.map(async (leg) => {
      const originCountry = leg.des_from.split(', ');
      const destinationCountry = leg.des_to.split(', ');
      return {
        originName: leg.origin_name,
        destinationName: leg.destination_name,
        originCountry: originCountry[originCountry.length - 1],
        destinationCountry: destinationCountry[destinationCountry.length - 1],
        originDescription: leg.des_from,
        destinationDescription: leg.des_to,
        originLocation: [parseInt(leg.start_long), parseFloat(leg.start_lat)],
        destinationLocation: [
          parseFloat(leg.end_long),
          parseFloat(leg.end_lat)
        ],
        originPlaceId: leg.origin,
        destinationPlaceId: leg.destination,
        departure: moment
          .utc(`${leg.departure}T${leg.time}`)
          .format('YYYY-MM-DDTHH:mm:ss'),
        fromPlaceType: leg.from_type,
        toPlaceType: leg.to_type
      };
    })
  );

  const trackData = {
    legs,
    timestamp,
    source: options.source,
    userData: options.userData,
    device: {
      os: options.deviceInfo,
      type: options.deviceType,
      platform: options.devicePlatform,
      platformName: options.devicePlatformName,
      version: options.deviceVersion
    },
    visitorId: options.visitorId,
    currency: options.currency,
    cabinClass: options.cabinClass,
    adults: options.adults,
    children: options.children,
    infants: options.infants,
    tripType: options.tripType,
    country: options.country,
    ip: options.userData.ip,
    language: options.language,
    departureDays: moment(
      moment(options.legs[0].departure).format('YYYY-MM-DD')
    ).diff(moment().format('YYYY-MM-DD'), 'days')
  };

  trackTransferSearch(searchId, trackData);
};
