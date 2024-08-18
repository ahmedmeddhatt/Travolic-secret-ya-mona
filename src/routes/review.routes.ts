import { Router } from 'express';

import {
  addComment,
  getAllReviewComment,
  addReaction,
  getAllReviewReaction,
  addReview,
  getReviews,
  getReviewsTotals
} from '../controllers/userReview.controller';

const reviewsEndpoints = (app: Router) => {
  app.route('/review').post(addReview).get(getReviews);

  app
    .route('/review/:reviewId/comment')
    .get(getAllReviewComment)
    .post(addComment);

  app
    .route('/review/:reviewId/react')
    .get(getAllReviewReaction)
    .post(addReaction);

  app.get('/review/totals', getReviewsTotals);

  return app;
};

export default reviewsEndpoints;
