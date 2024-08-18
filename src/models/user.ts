import { Types, Schema, model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import mongooseAutoPopulate from 'mongoose-autopopulate';
import { SocialAccountTypesEnum } from '../enums/social-account-types.enum';
import { UserRoleEnum } from '../enums/user-role.enum';
import { IUserDocument } from '../interfaces/user.interface';

const UserSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    isVerified: {
      type: Boolean,
      default: false
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    role: {
      type: String,
      enum: Object.values(UserRoleEnum),
      default: UserRoleEnum.User
    },
    confirmCode: {
      code: String,
      createdAt: Date
    },
    displayName: {
      type: String
    },
    email: {
      type: String,
      sparse: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    new_email: {
      type: String,
      sparse: true,
      unique: true
    },
    new_confirmCode: {
      code: String,
      createdAt: Date
    },
    linkedAccounts: {
      type: [
        {
          accountId: {
            type: String,
            required: true
          },
          accessToken: {
            type: String,
            required: true
          },
          type: {
            type: String,
            enum: Object.values(SocialAccountTypesEnum)
          }
        }
      ],
      default: []
    },
    avatarUrl: {
      type: String,
      default: ''
    },
    image: {
      type: Types.ObjectId,
      ref: 'Image',
      autopopulate: true
    },
    mainAirport: {
      type: String,
      default: ''
    },
    source: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

UserSchema.pre('save', function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next(err);
    }

    bcrypt.hash(this.password, salt, (err, hash) => {
      if (err) {
        return next(err);
      }

      this.password = hash;
      return next();
    });
  });
});

UserSchema.pre('findOne', function () {
  const query = this.getQuery();
  if (query.isVerified == null) {
    query.isVerified = true;
  }
});

UserSchema.pre('find', function () {
  const query = this.getQuery();
  if (query.isDeleted == null) {
    query.isDeleted = false;
  }
  if (query.isVerified == null) {
    query.isVerified = true;
  }
});

UserSchema.methods.comparePassword = function (
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

UserSchema.plugin(mongooseAutoPopulate);

const User = model<IUserDocument>('User', UserSchema);

export default User;
