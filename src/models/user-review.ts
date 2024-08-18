import { Model, Schema, Document, model } from 'mongoose';
import { UserReviewReactionEnum } from '../enums/reaction-enum';

export type UserReviewDocument = Document & {
  user?: Schema.Types.ObjectId;
  name?: string;
  email?: string;
  avatar?: string;
  title: string;
  text: string;
  rating: number;
  comments?: [
    {
      text: string;
      by: Schema.Types.ObjectId;
      name: string;
      email: string;
      date: Date;
    }
  ];
  reactions?: [
    {
      reaction: UserReviewReactionEnum;
      by?: string;
      user?: any;
    }
  ];
  likesCount?: number;
  dislikesCount?: number;
  userReaction?: UserReviewReactionEnum;
};

interface UserModel extends Model<UserReviewDocument> {
  calculateAverageRatings(): any;
}

export const userReviewSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: { type: String },
    avatar: String,
    title: String,
    text: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: [
      {
        text: String,
        by: { type: Schema.Types.ObjectId, ref: 'User' },
        name: String,
        email: String,
        date: Date
      }
    ],
    reactions: [
      {
        reaction: { type: String, enum: Object.values(UserReviewReactionEnum) },
        by: { type: String },
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: false
        }
      }
    ],
    likesCount: { type: Number, default: 0 },
    dislikesCount: { type: Number, default: 0 }
  },
  { timestamps: true, minimize: true }
);

userReviewSchema.pre<UserReviewDocument>('save', function (next) {
  if (!this.isModified('reactions')) {
    return next();
  }

  this.likesCount = this.reactions.filter(
    (reaction) => reaction.reaction == UserReviewReactionEnum.Like
  ).length;
  this.dislikesCount = this.reactions.filter(
    (reaction) => reaction.reaction == UserReviewReactionEnum.Dislike
  ).length;

  return next();
});

userReviewSchema.static(
  'calculateAverageRatings',
  async function calculateAverageRatings() {
    const stats = await this.aggregate([
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          rate_avg: { $avg: '$rating' }
        }
      },
      {
        $project: {
          _id: 0
        }
      }
    ]);

    const result =
      stats && stats.length > 0 ? stats[0] : { count: 0, rate_avg: 0 };

    return result;
  }
);

const UserReview = model<UserReviewDocument, UserModel>(
  'UserReview',
  userReviewSchema
);

export default UserReview;
