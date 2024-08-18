import { Request, Response, NextFunction } from 'express';
import { UserSearch } from '../models';
import { deleteUserHistorySchema } from '../validators/history.schema';
import { paginationSchema } from '../validators/pagination.schema';
import AppError from '../utils/appError.util';

export const getUserSearches = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = paginationSchema.validate(req.query);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const { page, limit, type } = value;

  const searches = await UserSearch.paginate(
    { userId: req.user.id, type },
    {
      page,
      limit,
      sort: { createdAt: -1 }
    }
  );

  if (!searches) {
    return next(new AppError('No searches found', 404));
  }

  return res.status(200).json(searches);
};

export const deleteUserSearch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { error, value } = deleteUserHistorySchema.validate(req.query);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const { searchId, type } = value;

  if (searchId) {
    const deletedSearch = await UserSearch.findById(searchId);

    if (!deletedSearch) {
      return next(new AppError('No search found', 404));
    }

    if (deletedSearch.userId.toString() !== req.user._id.toString()) {
      return next(
        new AppError('You are not authorized to delete this search', 403)
      );
    }

    await UserSearch.findByIdAndRemove(searchId);

    return res.status(200).json({ deleted: true });
  } else {
    const userId = req.user._id;

    if (!userId) return next(new AppError('User Not Found', 403));

    await UserSearch.deleteMany({ userId, type });

    return res.status(200).json({ deleted: true });
  }
};
