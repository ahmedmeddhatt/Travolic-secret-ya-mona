import Joi from 'joi';
import JoiObjectId from 'joi-objectid';

const objectId = JoiObjectId(Joi);

const addToFavouritesBaseSchema = Joi.object({
  type: Joi.string(),
  searchResult: Joi.any(),
  priceAlert: Joi.boolean().default(false).required(),
  price: Joi.object({
    amount: Joi.number().default(0.0).required(),
    currency: Joi.string().default('USD').required(),
    person: Joi.string().default(0.0).optional()
  }),
  userId: Joi.string(),
  itineraryId: Joi.string()
});

export const addToFavouritesSchema = addToFavouritesBaseSchema.keys({
  searchOptions: Joi.alternatives().conditional('type', [
    {
      is: 'Flights',
      then: Joi.object({
        cabinClass: Joi.string().optional(),
        directFlight: Joi.boolean().optional(),
        nearbyAirportOne: Joi.boolean().optional(),
        nearbyAirportTwo: Joi.boolean().optional(),
        currency: Joi.string().optional(),
        country: Joi.string().optional(),
        legs: Joi.array()
          .items(
            Joi.object({
              origin: Joi.array().items(Joi.string()).min(1).required(),
              destination: Joi.array().items(Joi.string()).min(1).required(),
              departure: Joi.string().required(),
              orig_city: Joi.boolean(),
              dest_city: Joi.boolean(),
              time: Joi.string(),
              start_lat: Joi.string(),
              start_long: Joi.string(),
              end_lat: Joi.string(),
              end_long: Joi.string(),
              origin_name: Joi.string(),
              destination_name: Joi.string(),
              from_type: Joi.string(),
              to_type: Joi.string(),
              des_from: Joi.string(),
              des_to: Joi.string(),
              arrival: Joi.string(),
              originPlaceType: Joi.string(),
              destinationPlaceType: Joi.string()
            })
          )
          .required()
          .min(1),
        tripType: Joi.string()
          .required()
          .valid('multi', 'round', 'oneway')
          .default('oneway'),
        visitorId: Joi.string().optional(),
        adults: Joi.number().optional(),
        children: Joi.number().optional(),
        infants: Joi.number().optional(),
        language: Joi.string().optional()
      }).required()
    },
    {
      is: 'Transfers',
      then: Joi.object({
        tripType: Joi.string()
          .required()
          .valid('multi', 'round', 'oneway')
          .default('oneway'),
        currency: Joi.string().optional(),
        country: Joi.string().optional(),
        language: Joi.string().optional(),
        legs: Joi.array()
          .items(
            Joi.object({
              origin: Joi.string().required(),
              destination: Joi.string().required(),
              departure: Joi.string().required(),
              orig_city: Joi.boolean(),
              dest_city: Joi.boolean(),
              time: Joi.string(),
              start_lat: Joi.string(),
              start_long: Joi.string(),
              end_lat: Joi.string(),
              end_long: Joi.string(),
              origin_name: Joi.string(),
              destination_name: Joi.string(),
              from_type: Joi.string(),
              to_type: Joi.string(),
              des_from: Joi.string(),
              des_to: Joi.string(),
              arrival: Joi.string(),
              originPlaceType: Joi.string(),
              destinationPlaceType: Joi.string()
            })
          )
          .required()
          .min(1),
        adults: Joi.number().optional(),
        children: Joi.number().optional(),
        infants: Joi.number().optional(),
        cabinClass: Joi.string().optional(),
        visitorId: Joi.string().optional()
      }).required()
    }
  ])
});
export const addToUserAlertSchema = Joi.object({
  searchOptions: Joi.object({
    tripType: Joi.string()
      .required()
      .valid('multi', 'round', 'oneway')
      .default('oneway'),
    currency: Joi.string().optional(),
    country: Joi.string().optional(),
    language: Joi.string().optional(),
    legs: Joi.array()
      .items(
        Joi.object({
          origin: Joi.string().required(),
          destination: Joi.string().required(),
          departure: Joi.string().required(),
          orig_city: Joi.boolean(),
          dest_city: Joi.boolean(),
          time: Joi.string(),
          start_lat: Joi.string(),
          start_long: Joi.string(),
          end_lat: Joi.string(),
          end_long: Joi.string(),
          origin_name: Joi.string(),
          destination_name: Joi.string(),
          from_type: Joi.string(),
          to_type: Joi.string(),
          des_from: Joi.string(),
          des_to: Joi.string(),
          arrival: Joi.string(),
          originPlaceType: Joi.string(),
          destinationPlaceType: Joi.string()
        })
      )
      .required()
      .min(1),
    adults: Joi.number().optional(),
    children: Joi.number().optional(),
    infants: Joi.number().optional(),
    cabinClass: Joi.string().optional(),
    visitorId: Joi.string().optional()
  }).required(),
  active: Joi.boolean().default(false).required(),
  price: Joi.object({
    amount: Joi.number().default(0.0).required(),
    currency: Joi.string().default('USD').required(),
    person: Joi.string().default(0.0).optional()
  }),
  userId: Joi.string(),
  type: Joi.string()
});
export const deleteAccountSchema = Joi.object({
  password: Joi.string().required()
});

export const deleteFavouriteSchema = Joi.object({
  favouritId: objectId().optional(),
  type: Joi.string().optional(),
  itineraryId: Joi.string().optional()
});

export const updateEmailSchema = Joi.object({
  email: Joi.string().email().required()
});

export const updateFavouriteSchema = Joi.object({
  favouritId: objectId().required(),
  priceAlert: Joi.boolean().default(false).required(),
  price: Joi.number().default(0.0).optional()
});
export const updateUserAlertSchema = Joi.object({
  active: Joi.boolean().default(false).required()
});

export const updatePasswordSchema = Joi.object({
  newPassword: Joi.string().min(8).required(),
  confirmPassword: Joi.string().min(8).required()
});

export const updateProfileSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  displayName: Joi.string().optional()
});
