import Joi from 'joi';

export const trendingSchema = Joi.object({
  currency: Joi.string().default('USD'),
  limit: Joi.number().default(20),
  page: Joi.number().default(1),
  search: Joi.string().default('')
});

export const trendingSchemV2 = Joi.object({
  currency: Joi.string().invalid('undefined', 'null').required().min(3),
  limit: Joi.number().default(10),
  code: Joi.string().required().min(3)
});

export const trendingNearBySchema = Joi.object({
  currency: Joi.string().invalid('undefined', 'null').required().min(3),
  limit: Joi.number().default(10)
});

export const trendingAirportsSchema = Joi.object({
  code: Joi.string().invalid('undefined', 'null').required(),
  type: Joi.string().valid('airport', 'city').required()
});

export const trendingAirportsSchemaV2 = Joi.object({
  code: Joi.string().required().min(3),
  currency: Joi.string().invalid('undefined', 'null').required().min(3),
  limit: Joi.number().default(10),
  type: Joi.string().valid('airport', 'city').required()
});

export const trendingCitiesSchema = Joi.object({
  code: Joi.string().invalid('undefined', 'null').required(),
  page: Joi.number().default(1),
  limit: Joi.number().default(10)
});

export const dynamicPageSectionsSchema = Joi.object({
  origin: Joi.string().invalid('undefined', 'null').required().min(2).max(3),
  orig_type: Joi.string().invalid('undefined', 'null').required(),
  destination: Joi.string().allow(null).min(2).max(3),
  dest_type: Joi.string().allow(null),
  currency: Joi.string().invalid('undefined', 'null').required().min(3),
  language: Joi.string().min(2).default('en'),
  limit: Joi.number().default(10)
});

export const cheapestFlightsEveryWhereSchema = Joi.object({
  origin: Joi.string().invalid('undefined', 'null').required().min(2).max(3),
  orig_type: Joi.string().invalid('undefined', 'null').required(),
  currency: Joi.string().invalid('undefined', 'null').required().min(3),
  language: Joi.string().min(2).default('en'),
  limit: Joi.number().default(10)
});

export const faqsSchema = Joi.object({
  origin: Joi.string().invalid('undefined', 'null').required().min(2).max(3),
  orig_type: Joi.string().invalid('undefined', 'null').required(),
  destination: Joi.string().allow(null).min(2).max(3),
  dest_type: Joi.string().allow(null),
  currency: Joi.string().invalid('undefined', 'null').required().min(3)
});
