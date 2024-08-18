import JoiBase from 'joi';
import JoiDate from '@joi/date';

const Joi = JoiBase.extend(JoiDate);

export const searchProviderParamsSchema = Joi.object({
  provider: Joi.string().required(),
  searchId: Joi.string().optional()
});

export const searchRequestparamsSchema = Joi.object({
  requestId: Joi.string().required()
});

export const searchFiltersSchema = Joi.object({
  status: Joi.string().valid('completed', 'empty').required(),
  origin: Joi.string().required(),
  destination: Joi.string().required(),
  tripType: Joi.string().required(),
  direct: Joi.number().default(0),
  oneStop: Joi.number().default(0),
  moreThanOneStop: Joi.number().default(0),
  airlines: Joi.array()
    .items({
      code: Joi.string(),
      amount: Joi.number()
    })
    .default([]),
  providers: Joi.array()
    .items({
      name: Joi.string(),
      amount: Joi.number()
    })
    .default([])
});

export const searchBodySchema = Joi.object({
  tripType: Joi.string().valid('round', 'multi', 'oneway').required(),
  cabinClass: Joi.string().required(),
  passengers: Joi.array().items(Joi.number()).length(3).optional(),
  directFlight: Joi.boolean().optional(),
  nearbyAirportOne: Joi.boolean().optional(),
  nearbyAirportTwo: Joi.boolean().optional(),
  legs: Joi.array().items({
    origin: Joi.string().invalid('undefined', 'null').required(),
    destination: Joi.string().invalid('undefined', 'null').required(),
    departure: Joi.string().invalid('undefined', 'null').required(),
    originPlaceType: Joi.string().optional(),
    destinationPlaceType: Joi.string().optional(),
    orig_city: Joi.boolean().optional(),
    dest_city: Joi.boolean().optional(),
    addAlternativeDestinations: Joi.boolean().optional(),
    addAlternativeOrigins: Joi.boolean().optional(),
    _id: Joi.any().optional()
  }),
  nomadLocation: Joi.array().items({
    locations: Joi.array().items(Joi.string()),
    nights_range: Joi.array().items(Joi.number())
  }),
  origin: Joi.any().optional(),
  destination: Joi.any().optional(),
  currency: Joi.string().required(),
  visitorId: Joi.string().optional(),
  adults: Joi.number().required(),
  children: Joi.number().required(),
  infants: Joi.number().required(),
  language: Joi.string().required(),
  country: Joi.string().required(),
  type: Joi.string().valid('Nomad', 'Train', 'flight').default('flight'),
  logId: Joi.string(),
  userData: {
    ip: Joi.string(),
    country_code: Joi.string()
  }
});

export const priceMatrixSchema = Joi.object({
  origin: Joi.string().required(),
  destination: Joi.string().required(),
  currency: Joi.string().required(),
  departureDateFrom: Joi.string().required(),
  departureDateTo: Joi.string().required(),
  returnDateFrom: Joi.string().required(),
  returnDateTo: Joi.string().required()
});

export const priceCalendarSchema = Joi.object({
  origin: Joi.string().required(),
  destination: Joi.string().required(),
  currency: Joi.string().required(),
  departureDate: Joi.string().required(),
  returnDate: Joi.string().allow('').optional()
});

export const radicalSchema = Joi.object({
  lat: Joi.number().required(),
  long: Joi.number().required(),
  dropoff: Joi.date().format('YYYY-MM-DDTHH:mm:ssZ').utc().required(),
  pickup: Joi.date().format('YYYY-MM-DDTHH:mm:ssZ').utc().required(),
  bags: Joi.number().required(),
  currency: Joi.string().required()
});

export const simtexSchema = Joi.object({
  currency: Joi.string().required(),
  country: Joi.string().required()
});

export const amenitiesSchema = Joi.object({
  flights: Joi.array()
    .items({
      id: Joi.string().required(),
      departure: Joi.string().required(),
      arrival: Joi.string().required(),
      flightNo: Joi.string().required(),
      airlineCode: Joi.string().required(),
      departureDate: Joi.string().required(),
      cabinClass: Joi.string().optional()
    })
    .max(300)
    .required(),

  lang: Joi.string().optional()
});

export const seatMapsSchema = Joi.object({
  flights: Joi.array()
    .items({
      id: Joi.string().required(),
      departure: Joi.string().required(),
      arrival: Joi.string().required(),
      flightNo: Joi.string().required(),
      airlineCode: Joi.string().required(),
      departureDate: Joi.string().required(),
      cabinClass: Joi.string().optional()
    })
    .required(),
  lang: Joi.string().optional()
});

export const PredictSchema = Joi.object({
  airline: Joi.string().required(),
  origin: Joi.string().required(),
  destination: Joi.string().required(),
  departureDate: Joi.string().required(),
  returnDate: Joi.string().optional(),
  currentPrice: Joi.string().optional(),
  currency: Joi.string().optional()
});

export const shareFlightByEmailAuth = Joi.object({
  link: Joi.string().required(),
  to: Joi.string().email().required()
});

export const shareFlightByEmailUnAuth = Joi.object({
  link: Joi.string().required(),
  fullName: Joi.string().required(),
  from: Joi.string().email().required(),
  to: Joi.string().email().required()
});

export const shareFlightByEmailSchema = Joi.object({
  link: Joi.string().required(),
  to: Joi.string().email().required()
});

export const mediaAlphaAds = Joi.object({
  url: Joi.string().required(),
  flights: Joi.array()
    .items({
      date: Joi.date().format('YYYY-MM-DD').required(),
      destination: Joi.alternatives()
        .try(Joi.array().items(Joi.string()), Joi.string())
        .required(),
      origin: Joi.alternatives()
        .try(Joi.array().items(Joi.string()), Joi.string())
        .required(),
      time: Joi.string()
        .valid(
          'Early',
          'Morning',
          'Morning',
          'Midday',
          'Afternoon',
          'Evening',
          'Night'
        )
        .optional()
    })
    .min(1)
    .required(),
  adults: Joi.number().required(),
  children: Joi.number().required(),
  infants: Joi.number().required(),
  cabin: Joi.string()
    .valid('Economy', 'premium_economy', 'business', 'first')
    .required(),
  localHour: Joi.number().min(0).max(23).default(0).optional(),
  locale: Joi.string()
    .pattern(/^[a-z]{2}(-[A-Z]{2})?$/)
    .default('en')
    .optional(),
  ua: Joi.string().required(),
  sub_1: Joi.string().optional(),
  sub_2: Joi.string().optional(),
  sub_3: Joi.string().optional()
});
