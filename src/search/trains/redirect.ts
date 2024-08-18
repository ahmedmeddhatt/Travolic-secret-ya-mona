import moment from 'moment';
import uuid from 'uuid';
import { decodeRedirectPayload, parseItineraryId } from '../../utils';
import createLoaders from '../data-sources';
import { trackTrainRedirect, getVisitor, getTrainSearch } from '../../track';
import providers from './providers';

const track = async (
  redirectId: string,
  payload: RedirectPayload,
  options: RedirectOptions,
  language: string
) => {
  const loaders = createLoaders();
  const timestamp = moment.utc().format();
  const {
    itineraryIds,
    searchId,
    visitorId,
    price,
    currency,
    adults,
    children,
    segments,
    infants
  } = options;
  const itineraryLegs = parseItineraryId(itineraryIds.join('|'));
  const [legs, visitor, search]: [any[], any, any] = await Promise.all([
    Promise.all(
      itineraryLegs.map(async (leg) => {
        const origin: any = await loaders.stations.load({
          code: leg.origin,
          language
        });
        const destination: any = await loaders.stations.load({
          code: leg.destination,
          language
        });
        if (!origin || !destination) {
          return {
            originStationID: leg.origin,
            destinationStationID: leg.destination,
            departure: moment(leg.departure, 'YYYYMMDDHHmm').format(),
            arrival: moment(leg.arrival, 'YYYYMMDDHHmm').format()
          };
        }
        return {
          origin: origin.city.name,
          originStationID: origin.code,
          originCountry: origin.city.state
            ? origin.city.state.country.name
            : origin.city.country.name,
          originLocation: origin.location.coordinates,
          destination: destination.city.name,
          destinationStationID: destination.code,
          destinationCountry: destination.city.state
            ? destination.city.state.country.name
            : destination.city.country.name,
          destinationLocation: destination.location.coordinates,
          departure: moment(leg.departure, 'YYYYMMDDHHmm').format(),
          arrival: moment(leg.arrival, 'YYYYMMDDHHmm').format()
        };
      })
    ),
    getVisitor(visitorId),
    getTrainSearch(searchId)
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
    visitor,
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
    segments: mappedSegments,
    departureDays: moment(moment(legs[0].departure).format('YYYY-MM-DD')).diff(
      moment().format('YYYY-MM-DD'),
      'days'
    )
  };

  trackTrainRedirect(redirectId, trackData);
};

const redirect = async (options: RedirectOptions, language: string) => {
  const redirectId = uuid.v4();
  let redirectPayload: any = {};
  for (const token of options.tokens) {
    const payload = decodeRedirectPayload(token);

    redirectPayload = {
      ...redirectPayload,
      ...payload
    };
  }

  redirectPayload = {
    ...redirectPayload,
    adults: options.adults,
    children: options.children,
    infants: options.infants,
    currency: options.currency
  };

  if (!redirectPayload.provider) {
    return { url: '/' };
  }

  const provider = providers[redirectPayload.provider.toLowerCase()];

  if (!provider) {
    return { url: '/' };
  }

  const url = redirectPayload.url
    ? redirectPayload.url
    : await provider.getRedirect(redirectId, redirectPayload);

  if (url !== undefined) {
    await track(redirectId, redirectPayload, options, language);

    return { url };
  }

  return {
    url: '/'
  };
};

export default redirect;
