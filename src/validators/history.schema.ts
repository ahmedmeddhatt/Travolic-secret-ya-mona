import Joi from 'joi';
import JoiObjectId from 'joi-objectid';

const objectId = JoiObjectId(Joi);

export const deleteSingleSearchHistorySchema = Joi.object({
  searchId: objectId().required()
});

export const deleteUserHistorySchema = Joi.object({
  searchId: objectId().optional(),
  type: Joi.string().valid('Flights', 'Trains', 'Transfers').optional()
});
