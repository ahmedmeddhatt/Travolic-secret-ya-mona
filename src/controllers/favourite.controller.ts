import { Request, Response, NextFunction } from 'express';
import { UserFavourites } from '../models';
import {
  addToFavouritesSchema,
  updateFavouriteSchema,
  deleteFavouriteSchema
} from '../validators/user.schema';
import { paginationSchema } from '../validators/pagination.schema';
import AppError from '../utils/appError.util';

export const addFavouriteSearch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { error, value } = addToFavouritesSchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }
  value.itineraryId = req.body.searchResult.itinerary.id;
  const userId = req.user.id;
  const favouriteAdded = await UserFavourites.create({
    userId,
    ...value
  });
  return res.status(200).json(favouriteAdded);
};

export const getUserFavourites = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { error, value } = paginationSchema.validate(req.query);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const { page, limit, type } = value;

  const favourites = await UserFavourites.paginate(
    { userId: req.user.id, type },
    {
      page,
      limit,
      sort: { createdAt: -1 }
    }
  );

  return res.status(200).json(favourites);
};

export const updateUserFavourite = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { favouritId } = req.params;
  const { error, value } = updateFavouriteSchema.validate({
    favouritId,
    ...req.body
  });

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const { priceAlert } = value;
  const updatedFav = await UserFavourites.findById(favouritId);

  if (!updatedFav) {
    return next(new AppError('Favourite not found', 404));
  }

  if (updatedFav.userId.toString() !== req.user._id.toString()) {
    return next(
      new AppError('You are not authorized to update this favourite', 403)
    );
  }

  if (priceAlert) {
    updatedFav.priceAlert = priceAlert;
  }

  await updatedFav.save();

  return res.status(200).json(updatedFav);
};

export const deleteUserFavourite = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { error, value } = deleteFavouriteSchema.validate(req.query);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }
  const userId = req.user._id;
  const { favouritId, type, itineraryId } = value;
  if (!favouritId && !type && !itineraryId) {
    return next(
      new AppError(
        'provide at least one param (favouritId,type,itineraryId)',
        400
      )
    );
  }

  if (favouritId) {
    UserFavourites.findOneAndRemove({ _id: favouritId, userId })
      .then((deletedFavourite) => {
        if (deletedFavourite) {
          return res.status(204).send();
        } else {
          return res.status(404).json({ message: 'Favourite not found' });
        }
      })
      .catch((err) => {
        return res
          .status(500)
          .json({ message: 'An error occurred', error: err.message });
      });
  } else if (itineraryId) {
    UserFavourites.findOneAndDelete({ userId, itineraryId })
      .then((deletedFavourite) => {
        if (deletedFavourite) {
          return res.status(204).send();
        } else {
          return res.status(404).json({ message: 'Favourite not found' });
        }
      })
      .catch((err) => {
        return res
          .status(500)
          .json({ message: 'An error occurred', error: err.message });
      });
  } else {
    UserFavourites.deleteMany({ userId, type })
      .then((deletedResult) => {
        const message =
          deletedResult.deletedCount === 0
            ? 'Nothing has been deleted'
            : `${deletedResult.deletedCount} favorite(s) deleted`;

        return res.status(200).json({ message });
      })
      .catch((err) => {
        return res
          .status(500)
          .json({ message: 'An error occurred', error: err.message });
      });
  }
};
