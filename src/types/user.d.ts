import { Schema } from 'mongoose';
import { SocialAccountTypesEnum } from '../enums/social-account-types.enum';
import { UserRoleEnum } from '../enums/user-role.enum';

declare global {
  namespace Express {
    type LinkedAccount = {
      accountId: string;
      accessToken: string;
      type: SocialAccountTypesEnum;
    };
    export interface User {
      id: string;
      _id: Schema.Types.ObjectId;
      email: string;
      password: string;
      isVerified: boolean;
      isDeleted: boolean;
      role: UserRoleEnum;
      firstName: string;
      lastName: string;
      image: any;
      displayName: string;
      confirmCode: {
        code: string;
        createdAt: Date;
      };
      linkedAccounts?: LinkedAccount[];
    }
  }
}

export {};
