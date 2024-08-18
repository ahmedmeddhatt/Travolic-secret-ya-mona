import axios from 'axios';
import moment from 'moment';
import * as cache from '../utils/cache.util';
import { Airport } from '../models';
import TranslationService from '../middlewares/translation';
import currencyConverter from '../middlewares/currencyConverter';

const { FLIGHTIO_API_URL, FLIGHTIO_API_KEY } = process.env;

const scheduleFlights = async (departureDate: string, origin: string) => {
  const current = moment().startOf('day');
  const departure = moment(departureDate, 'YYYY-MM-DD');
  const days = moment.duration(departure.diff(current)).asDays() + 1;
  let pages = [];
  for (let i = 1; i <= 2; i++) {
    const url = `${FLIGHTIO_API_URL}/compschedule/${FLIGHTIO_API_KEY}?mode=departures&day=${days}&iata=${origin}`;
    pages = await axios
      .get(url, {
        headers: {
          'content-type': 'application/json'
        }
      })
      .then((res) => (res ? res.data : []))
      .catch(() => []);

    if (pages.length > 0) {
      break;
    }
  }
  return pages;
};

const filteredFlights = async (departure: string, origin: any) => {
  const pages = await scheduleFlights(departure, origin.code);
  const arr = [];
  for (const page of pages) {
    const flights = page.airport.pluginData.schedule.departures.data;

    for (const flight of flights) {
      const { airport } = flight.flight;

      if (airport.destination === null) continue;

      const destination = airport.destination.code.iata;

      arr.includes(destination) || arr.push(destination);
    }
  }

  return arr;
};

const priceComparison = async (url: string) => {
  let prices;

  for (let i = 1; i <= 2; i++) {
    prices = await axios
      .get(url, {
        headers: {
          'content-type': 'application/json'
        }
      })
      .then((res) => (res ? res.data : []))
      .catch(() => []);

    if (prices.length > 0) {
      break;
    }
  }

  return prices;
};

const flightFilters = async (url: string, currency: string) => {
  const flights = await priceComparison(url);
  const convertCurrency = await currencyConverter(currency);

  const filters = {
    prices: {
      min: undefined,
      max: undefined
    },
    stops: {
      direct: undefined,
      oneStop: undefined,
      moreThanOneStop: undefined
    },
    durations: {
      min: undefined,
      max: undefined
    },
    airlines: []
  };

  if (flights.count > 0) {
    if (flights.filters) {
      const { minPrice, maxPrice, stops, tripDurations, airlines } =
        flights.filters;

      if (minPrice) {
        filters.prices.min = convertCurrency(
          minPrice.totalAmount,
          'USD'
        ).toFixed(2);
      }

      if (maxPrice) {
        filters.prices.max = convertCurrency(
          maxPrice.totalAmount,
          'USD'
        ).toFixed(2);
      }

      if (stops) {
        for (const stop of stops) {
          if (stop.code === 'DIRECT') {
            filters.stops.direct = convertCurrency(
              stop.price.totalAmount,
              'USD'
            ).toFixed(2);
          } else if (stop.code === 'ONE_STOP') {
            filters.stops.oneStop = convertCurrency(
              stop.price.totalAmount,
              'USD'
            ).toFixed(2);
          } else if (stop.code === 'MORE_THAN_ONE_STOP') {
            filters.stops.moreThanOneStop = convertCurrency(
              stop.price.totalAmount,
              'USD'
            ).toFixed(2);
          }
        }
      }

      if (tripDurations) {
        filters.durations.min = tripDurations.min;
        filters.durations.max = tripDurations.max;
      }

      if (airlines) {
        for (const airline of airlines) {
          filters.airlines.push({
            code: airline.code,
            amount: convertCurrency(airline.price.totalAmount, 'USD').toFixed(2)
          });
        }
      }
    }
  }

  return filters;
};

export const mapData = async (
  body: any,
  requestId: string,
  language: string
) => {
  const { origin, dates, filters, currency } = body;

  let airport: any = await Airport.find({ code: origin });

  airport = TranslationService.interceptor(language, airport);

  const request = {
    completed: false,
    requestId,
    origin: airport[0],
    data: []
  };

  cache.setJSON(requestId, request, {
    duration: moment.duration({
      minutes: 60
    })
  });

  const destinations = await filteredFlights(dates.departure, airport[0]);

  for (const destination of destinations) {
    let destinationAirport = await Airport.find({ code: destination });

    if (!destinationAirport) continue;

    destinationAirport = TranslationService.interceptor(
      language,
      destinationAirport
    );

    const tripObj = {
      destination: destinationAirport[0]
    };

    let url = '';
    if (filters.tripType === 'oneway') {
      url = `${FLIGHTIO_API_URL}/onewaytrip/${FLIGHTIO_API_KEY}/${airport.code}/${destination}/${dates.departure}/${filters.adults}/${filters.children}/${filters.infants}/${filters.tripClass}/USD`;
    } else {
      url = `${FLIGHTIO_API_URL}/roundtrip/${FLIGHTIO_API_KEY}/${airport.code}/${destination}/${dates.departure}/${dates.return}/${filters.adults}/${filters.children}/${filters.infants}/${filters.tripClass}/USD`;
    }

    const trip = await flightFilters(url, currency);

    tripObj['filters'] = trip;

    request.data.push(tripObj);

    cache.setJSON(requestId, request, {
      duration: moment.duration({
        minutes: 60
      })
    });
  }

  request.completed = true;
  cache.setJSON(requestId, request, {
    duration: moment.duration({
      minutes: 60
    })
  });
};

export const getCachedMapData = async (requestId: string) => {
  const request = await cache.getJSON(requestId);

  if (request) {
    return request;
  }

  return {};
};
