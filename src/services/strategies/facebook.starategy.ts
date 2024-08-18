import { User } from '../../models';
import { Strategy as FacebookStrategy } from 'passport-facebook';

import { SocialAccountTypesEnum } from '../../enums/social-account-types.enum';

const { FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECERT, FACEBOOK_CALLBACK_URL } =
  process.env;
export class Facebook {
  public static init(_passport: any): any {
    _passport.use(
      new FacebookStrategy(
        {
          clientID: FACEBOOK_CLIENT_ID,
          clientSecret: FACEBOOK_CLIENT_SECERT,
          callbackURL: FACEBOOK_CALLBACK_URL,
          passReqToCallback: true
        },
        async function (req, accessToken, refreshToken, profile, cb) {
          try {
            let stateUser;
            const { state } = req.query;
            if (state) {
              stateUser = await User.findById(state);
              if (!stateUser) {
                return cb({ msg: 'User Id Not Found!', path: 'state' });
              }
            }

            const profileUser = await User.findOne({
              linkedAccounts: {
                $elemMatch: {
                  accountId: profile.id,
                  type: SocialAccountTypesEnum.FACEBOOK
                }
              }
            });

            if (profileUser) {
              if (state) {
                if (profileUser._id.toString() !== (state as string)) {
                  return cb({
                    msg: 'Account Mismatch',
                    path: 'state'
                  });
                }
              }

              const payload = profileUser.toObject({
                virtuals: false
              });

              return cb(null, {
                ...payload,
                password: undefined,
                confirmCode: undefined
              });
            } else {
              if (req.query.state) {
                if (!stateUser) {
                  return cb({ msg: 'User Id Not Found!' });
                }

                if (!stateUser.linkedAccounts) {
                  stateUser.linkedAccounts = [];
                }

                stateUser.linkedAccounts.push({
                  accountId: profile.id,
                  type: SocialAccountTypesEnum.FACEBOOK,
                  accessToken: accessToken
                });

                await stateUser.save();

                const payload = stateUser.toObject({
                  virtuals: false
                });

                return cb(null, {
                  ...payload,
                  password: undefined,
                  confirmCode: undefined,
                  linkedAccounts: undefined
                });
              }

              const newUser = new User({
                isVerified: true,
                password: accessToken,
                displayName: profile.displayName,
                emails: profile.emails,
                linkedAccounts: [
                  {
                    accountId: profile.id,
                    type: SocialAccountTypesEnum.FACEBOOK,
                    accessToken: accessToken
                  }
                ]
              });

              await newUser.save();

              const payload = newUser.toObject({
                virtuals: false
              });

              return cb(null, {
                ...payload,
                password: undefined,
                confirmCode: undefined,
                linkedAccounts: undefined
              });
            }
          } catch (error) {
            return cb(error, false);
          }
        }
      )
    );
  }
}
