import JoiBase from 'joi';
import JoiDate from '@joi/date';

const Joi = JoiBase.extend(JoiDate);

export const searchProviderParamsSchema = Joi.object({
  provider: Joi.string().required()
});

export const searchRequestparamsSchema = Joi.object({
  requestId: Joi.string().required()
});

export const searchBodySchema = Joi.object({
  id: Joi.number().required(),
  isCity: Joi.boolean().required(),
  checkIn: Joi.date().format('YYYY-MM-DD'),
  checkOut: Joi.date().format('YYYY-MM-DD'),
  currency: Joi.string().required(),
  visitorId: Joi.string().optional(),
  adults: Joi.number().required(),
  children: Joi.number().required(),
  infants: Joi.number().required(),
  rooms: Joi.number().required(),
  language: Joi.string().required(),
  country: Joi.string().required(),
  logId: Joi.string(),
  userData: {
    ip: Joi.string(),
    country_code: Joi.string()
  }
});

export const hotelsMediaAlphaAds = Joi.object({
  url: Joi.string().required(),
  check_in_date: Joi.date().format('YYYY-MM-DD').required(),
  check_out_date: Joi.date().format('YYYY-MM-DD').required(),
  city_name: Joi.string().optional(),
  hotels: Joi.array().optional(),
  guests: Joi.object({
    adults: Joi.number().required(),
    children: Joi.number().required()
  }).required(),
  localHour: Joi.number().min(0).max(23).default(0).optional(),
  rooms: Joi.number().optional(),
  locale: Joi.string()
    .pattern(/^[a-z]{2}(-[A-Z]{2})?$/)
    .default('en')
    .optional(),
  ua: Joi.string().required(),
  sub_1: Joi.string().optional(),
  sub_2: Joi.string().optional(),
  sub_3: Joi.string().optional()
});
