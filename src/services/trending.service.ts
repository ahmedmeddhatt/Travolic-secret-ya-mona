import { TopDestination, Airport, Image, City } from '../models';
import getIPData from '../utils/ipData.util';
import TranslationService from '../middlewares/translation';
import currencyConverter from '../middlewares/currencyConverter';

export const trendingService = async (
  ip: string,
  language: string,
  currency: string,
  page: number,
  limit: number,
  search: string
): Promise<any> => {
  const { location, country_code } = await getIPData(ip, 'server');

  const airports = await Airport.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: location
        },
        $maxDistance: 200.7 * 1000,
        $minDistance: 10
      }
    },
    isActive: true
  });

  if (airports.length === 0) {
    return {
      status: 'Error',
      code: 404,
      message: 'No airports found'
    };
  }

  let trends = [];
  let trendingData = [];

  const convertCurrency = await currencyConverter(currency);

  for (const airport of airports) {
    const country = airport.city.state
      ? airport.city.state.country.code
      : airport.city.country.code;

    if (country !== country_code) {
      continue;
    }

    const trendingDestinations: any = await TopDestination.trendingPipeline(
      limit,
      page,
      airport.code,
      search
    );

    if (trendingDestinations[0].data.length === 0) {
      continue;
    }

    trendingData.push(...trendingDestinations[0].data);
  }

  trendingData = trendingData.slice(0, limit);

  const destiantions = trendingData.map(
    (destination) => destination.destinationCityCode
  );

  const images = await Image.find({
    $in: destiantions
  });

  trendingData = trendingData.sort((a, b) => b.rank - a.rank);

  for (let trendingDestination of trendingData) {
    trendingDestination = TranslationService.interceptor(language, [
      trendingDestination
    ])[0];

    const image = images.find(
      (image) => image.filename === trendingDestination.destinationCityCode
    );

    trends.push({
      oneWayPrice: {
        minPrice: convertCurrency(
          trendingDestination.oneWayPrice.minPrice.amount,
          'USD'
        ).toFixed(2)
      },
      roundPrice: {
        minPrice: convertCurrency(
          trendingDestination.roundPrice.minPrice.amount,
          'USD'
        ).toFixed(2)
      },
      currency,
      destination: {
        name: trendingDestination.destinationName,
        code: trendingDestination.destinationCode
      },
      origin: {
        name: trendingDestination.originName,
        code: trendingDestination.originCode
      },
      phrase: trendingDestination.phrase,
      image: image ? image.url : ''
    });
  }

  trends = trends.filter(
    (value, index, self) =>
      index === self.findIndex((t) => t.phrase === value.phrase)
  );

  return trends;
};

export const trendingAirportsService = async (
  code: string,
  type: string,
  language: string,
  page: number,
  limit: number
): Promise<any> => {
  let item: any = {};

  if (type === 'airport') {
    item = await Airport.findOne({ code });

    if (!item) {
      return {
        status: 'Error',
        code: 404,
        message: 'Airport not found'
      };
    }
  } else if (type === 'city') {
    item = await City.findOne({ code });

    if (!item) {
      return {
        status: 'Error',
        code: 404,
        message: 'City not found'
      };
    }
  }

  let trendingDestinations = await TopDestination.trendingAirportsPipeline(
    item.code,
    type,
    page,
    limit
  );

  trendingDestinations = TranslationService.interceptor(
    language,
    trendingDestinations
  );

  return trendingDestinations;
};
