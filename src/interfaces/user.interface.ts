import { Document } from 'mongoose';
import { SocialAccountTypesEnum } from '../enums/social-account-types.enum';
import { UserRoleEnum } from '../enums/user-role.enum';

interface ILinkedAccountDocument extends Document {
  accountId: string;
  accessToken: string;
  type: SocialAccountTypesEnum;
}

export interface IUserDocument extends Document {
  email: string;
  password: string;
  source: string;
  isVerified: boolean;
  isDeleted: boolean;
  role: UserRoleEnum;
  firstName?: string;
  avatarUrl?: string;
  lastName?: string;
  image: any;
  displayName?: string;
  confirmCode: {
    code: string;
    createdAt: Date;
  };
  new_email: string;
  new_confirmCode: {
    code: string;
    createdAt: Date;
  };
  linkedAccounts?: ILinkedAccountDocument[];
  comparePassword(password: string): Promise<boolean>;
}
