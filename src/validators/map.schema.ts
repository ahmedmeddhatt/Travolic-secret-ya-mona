import JoiBase from 'joi';
import JoiDate from '@joi/date';

const Joi = JoiBase.extend(JoiDate);

export const mapSchema = Joi.object({
  tripType: Joi.string().valid('round', 'oneway').required(),
  currency: Joi.string().required()
});

export const mapBodySchema = Joi.object({
  origin: Joi.string().invalid('undefined', 'null').required(),
  dates: {
    departure: Joi.date().format('YYYY-MM-DD').required(),
    return: Joi.date().format('YYYY-MM-DD').optional()
  },
  filters: {
    tripType: Joi.string().valid('round', 'oneway').required(),
    tripClass: Joi.string().required(),
    adults: Joi.number().required(),
    children: Joi.number().required(),
    infants: Joi.number().required()
  },
  currency: Joi.string().required()
});

export const mapOriginDestinationSchema = Joi.object({
  origin: Joi.string().invalid('undefined', 'null').required(),
  originPlaceType: Joi.string().valid('airport', 'city').required(),
  destination: Joi.string().invalid('undefined', 'null').required(),
  destinationPlaceType: Joi.string().valid('airport', 'city').required(),
  tripType: Joi.string().valid('round', 'oneway').required(),
  currency: Joi.string().required()
});

export const mapOriginSchema = Joi.object({
  origin: Joi.string().invalid('undefined', 'null').required(),
  originPlaceType: Joi.string().valid('airport', 'city').required(),
  tripType: Joi.string().valid('round', 'oneway').required(),
  currency: Joi.string().required()
});

export const mapCachedSchema = Joi.object({
  requestId: Joi.string().required()
});
