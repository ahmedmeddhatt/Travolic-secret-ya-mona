import axios from 'axios';
import logger from '../../../../configs/logger';
import { routes } from './routes';

const { SAFARNI_API_URL, SAFARNI_BLOCKED_COUNTRIES } = process.env;

const cabinClassMap = {
  Economy: 'E',
  Business: 'B',
  First: 'F'
};

const transformOptions = (options: SearchOptions) => {
  const {
    tripType,
    currency,
    country,
    language,
    legs,
    adults,
    children,
    infants,
    cabinClass
  } = options;
  return {
    tripType,
    currency,
    country,
    language,
    legs,
    adults,
    children,
    infants,
    cabinClass: cabinClassMap[cabinClass]
  };
};

const search = async (input: SearchOptions) => {
  const options = transformOptions(input);

  if (SAFARNI_BLOCKED_COUNTRIES.split(',').includes(options.country)) {
    return {};
  }

  const payload = {
    adultsCount: options.adults,
    childrenCount: options.children,
    infantsCount: options.infants,
    currencyCode: options.currency,
    locale: options.language,
    legs: [],
    cabin: options.cabinClass
  };
  const departureDate = new Date();

  departureDate.setDate(departureDate.getDate() + 3);

  const departureResult = departureDate.toISOString().slice(0, 10);

  if (options.legs[0].departure >= departureResult) {
    if (options.country === 'AE') {
      if (options.tripType === 'oneway') {
        const allowRoutes = routes.find(
          (item) =>
            item.origin == options.legs[0].origin &&
            item.destination === options.legs[0].destination
        );
        if (!allowRoutes) {
          return {};
        }
      } else {
        for (const leg of options.legs) {
          const allowRoutes = routes.find(
            (item) =>
              item.origin == leg.origin && item.destination === leg.destination
          );
          if (!allowRoutes) {
            return {};
          }
        }
      }
    }

    for (const leg of options.legs) {
      payload.legs.push({
        departureCode: leg.origin,
        arrivalCode: leg.destination,
        outboundDate: leg.departure
      });
    }

    const data = await axios
      .post(SAFARNI_API_URL, payload)
      .then((res) => res.data)
      .catch((err) => {
        logger.error(err);
        return {};
      });

    return data;
  } else {
    return {};
  }
};

export default search;
