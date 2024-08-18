import axios from 'axios';
import { NextFunction } from 'express';
import AppError from '../utils/appError.util';

export const createKayakSession = async (
  domain: string,
  userAgent: string,
  next: NextFunction
) => {
  const affiliateId = 'kan_315014_591081';
  const token = 'BUqO7zY_Syt$z0pEEBWEMc';
  const sessionUrl = `${domain}/a/api/session?token=${token}&a=${affiliateId}`;

  const response = await axios
    .post(
      sessionUrl,
      {},
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': userAgent
        }
      }
    )
    .then((res) => res.data)
    .catch(() => {
      return next(new AppError('No Data is found', 404));
    });

  if (!response || !response.sid) {
    return next(new AppError('No Data is found', 404));
  }

  return response.sid;
};

const createKayakFlightLeg = (legs) =>
  legs.map((leg) => {
    return {
      originAirport: leg.origin[0],
      destinationAirport: leg.destination[0],
      date: leg.departure
    };
  });

export const createKayakFlightPayload = (value, adsType) => {
  const CABIN_MAP = {
    Premium_Economy: 'premiumEconomy',
    Business: 'business',
    First: 'first',
    Economy: 'economy',
    Mixed: 'mixed'
  };

  const payload = {};

  if (adsType === 'compareTo') {
    payload['showOn'] = 'results';
  }

  payload['legs'] = createKayakFlightLeg(value.legs);

  payload['cabinClass'] = CABIN_MAP[value.cabinClass];

  const numberOfSeatInfants =
    value.infants > value.adults ? value.infants - value.adults : 0;

  const adult = Array.from({ length: value.adults }).map(() => 'adult');

  const child = Array.from({ length: value.children }).map(() => 'child');

  const lapInfant = Array.from({
    length: numberOfSeatInfants > 0 ? value.adults : value.infants
  }).map(() => 'lapInfant');

  const seatInfant = Array.from({
    length: numberOfSeatInfants > 0 ? numberOfSeatInfants : 0
  }).map(() => 'seatInfant');

  payload['passengers'] = [...adult, ...child, ...lapInfant, ...seatInfant];

  return payload;
};

export const createKayakHotelPayload = (value) => {
  /*
    find kayak cityId by city IATA code
  */

  const cityId = 1000;

  return {
    showOn: 'results',
    checkinDate: value.checkIn,
    checkoutDate: value.checkOut,
    adults: value.adults,
    children: value.children,
    rooms: value.rooms,
    cityId: cityId
  };
};

export const createKayakCarRentalPayload = (value) => {
  return {
    showOn: 'results',
    pickUpDate: value.pickUpDate,
    dropOffDate: value.dropOffDate,
    pickUpLocation: { type: 'airport', locationQuery: value.pickUpLocation },
    dropOffLocation: value.dropOffLocation
      ? { type: 'airport', locationQuery: value.dropOffLocation }
      : undefined,
    pickUpHour: value.pickUpHour,
    dropOffHour: value.dropOffHour
  };
};

export const getAdsData = async (payload, url, userAgent) => {
  return await axios
    .post(url, payload, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': userAgent
      }
    })
    .then((res) => res.data)
    .catch(() => {
      return null;
    });
};

export const transformResults = (data, domain) => {
  const { compareToItems } = data;

  const items = compareToItems.map((item) => {
    item.logoUrl = `${domain}${item.logoUrl}`;
    item.deepLink = `${domain}${item.deepLink}`;
    item.impressionUrl = `${domain}${item.impressionUrl}`;
    return item;
  });
  data.compareToItems = items;

  return data;
};

export const transformResultsInline = (data, domain) => {
  const { inlineItems } = data;

  const items = inlineItems.map((item) => {
    item.logoUrl = `${domain}${item.logoUrl}`;
    item.deepLink = `${domain}${item.deepLink}`;
    item.impressionUrl = `${domain}${item.impressionUrl}`;
    return item;
  });
  data.inlineItems = items;

  return data;
};
