import moment from 'moment';
import uuid from 'uuid';
import {
  decodeHotelRedirectPayload,
  decodeRedirectPayload,
  parseItineraryId
} from '../utils';
import createLoaders from './data-sources';
import {
  trackFlightRedirect,
  trackTransferRedirect,
  getVisitor,
  getTransferSearch,
  getFlightSearch,
  trackHotelRedirect
} from '../track';
import flightProviders from './flights/providers';
import transferProviders from './transfers/providers';
import hotelProviders from './hotels/providers';

const trackFlight = async (
  redirectId: string,
  payload: RedirectPayload,
  options: RedirectOptions,
  language: string
) => {
  const loaders = createLoaders();
  const timestamp = moment.utc().format();
  const {
    itineraryId,
    segments,
    searchId,
    visitorId,
    price,
    currency,
    adults,
    children,
    infants
  } = options;

  const itineraryLegs = parseItineraryId(itineraryId);
  const [legs, visitor, search]: [any[], any, any] = await Promise.all([
    Promise.all(
      itineraryLegs.map(async (leg) => {
        const origin: any = await loaders.airports.load({
          code: leg.origin,
          language
        });
        const destination: any = await loaders.airports.load({
          code: leg.destination,
          language
        });

        if (!origin || !destination) {
          return {
            originAirportID: leg.origin,
            destinationAirportID: leg.destination,
            departure: moment(leg.departure, 'YYYYMMDDHHmm').format(),
            arival: moment(leg.arrival, 'YYYYMMDDHHmm').format()
          };
        }

        return {
          origin: origin.city.name,
          originAirportID: origin.code,
          originCountry: origin.city.state
            ? origin.city.state.country.name
            : origin.city.country.name,
          originCountryCode: origin.city.state
            ? origin.city.state.country.code
            : origin.city.country.code,
          originLocation: [
            parseFloat(origin.location.longitude),
            parseFloat(origin.location.latitude)
          ],
          destination: destination.city.name,
          destinationAirportID: destination.code,
          destinationCountry: destination.city.state
            ? destination.city.state.country.name
            : destination.city.country.name,
          destinationCountryCode: destination.city.state
            ? destination.city.state.country.code
            : destination.city.country.code,
          destinationLocation: [
            parseFloat(destination.location.longitude),
            parseFloat(destination.location.latitude)
          ],
          departure: moment(leg.departure, 'YYYYMMDDHHmm').format(),
          arival: moment(leg.arrival, 'YYYYMMDDHHmm').format(),
          isDomestic: origin.city.country.code === destination.city.country.code
        };
      })
    ),
    getVisitor(visitorId),
    getFlightSearch(searchId)
  ]);

  const mappedSegments = segments
    ? segments.map((segment) => {
        return {
          ...segment,
          departure: moment(segment.departure, 'YYYYMMDDHHmm').format(),
          arrival: moment(segment.arrival, 'YYYYMMDDHHmm').format()
        };
      })
    : [];

  const trackData = {
    searchId,
    device: search ? search.device : undefined,
    provider: payload.provider,
    agentName: payload.agentName,
    agentId: payload.agentId,
    legs,
    price,
    currency,
    passengers: {
      adults,
      children,
      infants
    },
    isDomestic: legs.every((leg) => leg.isDomestic),
    timestamp,
    visitor,
    segments: mappedSegments,
    departureDays: moment(moment(legs[0].departure).format('YYYY-MM-DD')).diff(
      moment().format('YYYY-MM-DD'),
      'days'
    ),
    utm_source: options.utm_source ? options.utm_source : 'travolic'
  };

  await trackFlightRedirect(redirectId, trackData);
};

const trackTransfer = async (
  redirectId: string,
  payload: RedirectPayload,
  options: RedirectOptions
) => {
  const timestamp = moment.utc().format();
  const { searchId, visitorId, price, currency, adults, children, infants } =
    options;
  const [legs, visitor, search]: [any[], any, any] = await Promise.all([
    Promise.all(
      options.legs.map((leg) => {
        const originCountry = leg.des_from.split(', ');
        const destinationCountry = leg.des_to.split(', ');

        return {
          originName: leg.origin_name,
          destinationName: leg.destination_name,
          originCountry: originCountry[originCountry.length - 1],
          destinationCountry: destinationCountry[destinationCountry.length - 1],
          originDescription: leg.des_from,
          destinationDescription: leg.des_to,
          originLocation: [
            parseFloat(leg.start_long),
            parseFloat(leg.start_lat)
          ],
          destinationLocation: [
            parseFloat(leg.end_long),
            parseFloat(leg.end_lat)
          ],
          originPlaceId: leg.origin,
          destinationPlaceId: leg.destination,
          departure: leg.departure,
          arrival: leg.arrival,
          time: leg.time,
          fromPlaceType: leg.from_type,
          toPlaceType: leg.to_type
        };
      })
    ),
    getVisitor(visitorId),
    getTransferSearch(searchId)
  ]);
  const trackData = {
    searchId,
    device: search ? search.device : undefined,
    provider: payload.provider,
    agentName: payload.agentName,
    agentId: payload.agentId,
    legs,
    price,
    currency,
    passengers: {
      adults,
      children,
      infants
    },
    timestamp,
    visitor,
    departureDays: moment(moment(legs[0].departure).format('YYYY-MM-DD')).diff(
      moment().format('YYYY-MM-DD'),
      'days'
    )
  };

  await trackTransferRedirect(redirectId, trackData);
};

const trackHotel = async (
  redirectId: string,
  payload: HotelRedirectPayload,
  options: HotelRedirectOptions
) => {
  const timestamp = moment.utc().format();
  const { searchId, visitorId, price, currency, rooms, adults, children } =
    options;

  const [visitor, search]: [any, any] = await Promise.all([
    getVisitor(visitorId),
    getTransferSearch(searchId)
  ]);

  const trackData: HotelRedirectsTrackData = {
    searchId,
    device: search ? search.device : undefined,
    provider: payload.provider,
    agentName: payload.agentName,
    agentId: payload.agentId,
    price,
    currency,
    guests: {
      adults,
      children
    },
    timestamp,
    visitor,
    roomsCount: +rooms,
    checkIn: moment(moment(options.checkIn).format('YYYY-MM-DD'))
      .diff(moment().format('YYYY-MM-DD'), 'days')
      .toString(),
    checkOut: moment(moment(options.checkIn).format('YYYY-MM-DD'))
      .diff(moment().format('YYYY-MM-DD'), 'days')
      .toString()
  };

  await trackHotelRedirect(redirectId, trackData);
};

const trackMapping = {
  flight: trackFlight,
  transfer: trackTransfer
};

const providersMapping = {
  flight: flightProviders,
  transfer: transferProviders
};

export const redirect = async (options: RedirectOptions, language: string) => {
  const redirectId = uuid.v4();
  const payload = decodeRedirectPayload(options.token);
  const withoutID = ['aerocrs'];
  const track = trackMapping[options.type];
  const providers = providersMapping[options.type];
  const provider = providers[payload.provider];

  if (!provider) {
    return { url: '/' };
  }

  let url = undefined;

  const redirectPayload = {
    ...payload,
    language,
    adults: options.adults,
    children: options.children,
    infants: options.infants,
    currency: options.currency,
    country: options.country
  };

  if (provider.getRedirect) {
    const redirectData = await provider.getRedirect(
      redirectId,
      redirectPayload
    );
    url = redirectData;
  } else {
    if (!redirectPayload.url.includes('?')) {
      url = withoutID.includes(redirectPayload.provider)
        ? redirectPayload.url
        : `${redirectPayload.url}?redirectID=${redirectId}`;
    } else {
      url = withoutID.includes(redirectPayload.provider)
        ? redirectPayload.url
        : `${redirectPayload.url}&redirectID=${redirectId}`;
    }
  }

  if (url !== undefined) {
    await track(redirectId, redirectPayload, options, language);

    return { url };
  }

  return { url: '/' };
};

export const hotelRedirect = async (
  options: HotelRedirectOptions,
  language: string
) => {
  const redirectId = uuid.v4();
  const payload = decodeHotelRedirectPayload(options.token);
  const withoutID = ['aerocrs'];
  const provider = hotelProviders[payload.provider];

  if (!provider) {
    return { url: '/' };
  }

  let url = undefined;

  const redirectPayload = {
    ...payload,
    language,
    adults: options.adults,
    children: options.children,
    currency: options.currency,
    country: options.country
  };

  if (provider.getRedirect) {
    const redirectData = await provider.getRedirect(
      redirectId,
      redirectPayload
    );
    url = redirectData;
  } else {
    if (!redirectPayload.url.includes('?')) {
      url = withoutID.includes(redirectPayload.provider)
        ? redirectPayload.url
        : `${redirectPayload.url}?redirectID=${redirectId}`;
    } else {
      url = withoutID.includes(redirectPayload.provider)
        ? redirectPayload.url
        : `${redirectPayload.url}&redirectID=${redirectId}`;
    }
  }

  if (url !== undefined) {
    await trackHotel(redirectId, redirectPayload, options);

    return { url };
  }

  return { url: '/' };
};
