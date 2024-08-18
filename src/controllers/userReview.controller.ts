import { Request, Response, NextFunction } from 'express';
import { RatingEnumQuery } from '../enums/rating-enum';
import { UserReview } from '../models';
import {
  addAuthReviewSchema,
  addReviewSchema,
  getReviewsSchema,
  addReactionSchema,
  addCommentSchema
} from '../validators/userReview.schema';
import ipData from '../utils/ipData.util';
import AppError from '../utils/appError.util';

export const addReview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let review: any = {};

  if (req.user) {
    const { error, value } = addAuthReviewSchema.validate(req.body);

    if (error) {
      return next(new AppError(error.details[0].message, 422));
    }

    review = {
      user: req.user._id,
      ...value
    };
  } else {
    const { error, value } = addReviewSchema.validate(req.body);

    if (error) {
      return next(new AppError(error.details[0].message, 422));
    }

    review = {
      user: null,
      ...value
    };
  }

  const reviewAdded = new UserReview(review);

  await reviewAdded.save();

  return res.status(201).json(reviewAdded);
};

export const getReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = getReviewsSchema.validate(req.query);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const filter: any = {};

  if (value.rating) {
    filter.rating = RatingEnumQuery[value.rating];
  }

  if (value.dateFrom) {
    filter.createdAt = { $gt: new Date(value.dateFrom) };
  }

  const { ip } = await ipData(req.ip, 'server');

  let reviews = await UserReview.find(filter, {}, {})
    .populate('user', ['displayName', 'avatarUrl', 'email'])
    .skip(value.page - 1)
    .limit(value.limit)
    .sort({ updatedAt: -1 });

  if (reviews.length === 0) {
    return next(new AppError('No review found', 404));
  }

  reviews = reviews.map((review) => {
    if (req.user) {
      const userReaction = review.reactions.find(
        (reaction) =>
          reaction.user && reaction.user.toString() === req.user._id.toString()
      );

      review = JSON.parse(JSON.stringify(review));

      review.userReaction = userReaction ? userReaction.reaction : null;

      return review;
    } else {
      const userReaction = review.reactions.find(
        (reaction) => reaction.by && reaction.by.toString() === ip.toString()
      );

      review = JSON.parse(JSON.stringify(review));

      review.userReaction = userReaction ? userReaction.reaction : null;

      return review;
    }
  });

  return res.status(200).json(reviews);
};

export const getReviewsTotals = async (req: Request, res: Response) => {
  const result = await UserReview.calculateAverageRatings();

  return res.status(200).json(result);
};

export const addComment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = addCommentSchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const review = await UserReview.findOne({ _id: req.params.reviewId });

  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  if (req.user) {
    const { _id: id, email, displayName } = req.user;

    review.comments.push({
      text: value.text,
      by: id,
      name: displayName,
      email,
      date: new Date()
    });
  } else {
    if (!value.user && !value.email) {
      return next(new AppError('User or email is required', 422));
    }

    review.comments.push({
      text: value.text,
      by: null,
      name: value.name,
      email: value.email,
      date: new Date()
    });
  }

  await review.save();

  return res.status(200).json(review);
};

export const getAllReviewComment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const review = await UserReview.findOne({ _id: req.params.reviewId });

  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  return res.status(200).json(review.comments);
};

export const addReaction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = addReactionSchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const review = await UserReview.findOne({ _id: req.params.reviewId });

  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  let isFound = false;

  const { ip } = await ipData(req.ip, 'server');

  if (req.user) {
    review.reactions.filter(async (reaction, index) => {
      if (reaction.user && reaction.user.toString() == req.user._id) {
        if (reaction.reaction !== value.reaction) {
          reaction.reaction = value.reaction;
        } else {
          review.reactions.splice(index, 1);
        }

        isFound = true;
      }
    });
  } else {
    review.reactions.filter(async (reaction, index) => {
      if (reaction.by && reaction.by === ip) {
        if (reaction.reaction !== value.reaction) {
          reaction.reaction = value.reaction;
        } else {
          review.reactions.splice(index, 1);
        }

        isFound = true;
      }
    });
  }

  if (isFound) {
    await review.save();
  } else {
    review.reactions.push({
      reaction: value.reaction,
      by: req.user ? null : ip,
      user: req.user
    });

    await review.save();
  }

  return res.status(200).json(review);
};

export const getAllReviewReaction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const review = await UserReview.findOne({ _id: req.params.reviewId });

  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  return res.status(200).json(review.reactions);
};
