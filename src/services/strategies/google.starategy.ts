import { User } from '../../models';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { SocialAccountTypesEnum } from '../../enums/social-account-types.enum';

const { GOOGLE_CLIENT_ID, GOOGLE_CLEINT_SECRET, GOOGLE_PLACE_URL } =
  process.env;

export class Google {
  public static init(_passport: any): any {
    _passport.use(
      new GoogleStrategy(
        {
          clientID: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLEINT_SECRET,
          callbackURL: GOOGLE_PLACE_URL,
          passReqToCallback: true
        },
        async function (req, accessToken, refreshToken, profile, cb) {
          try {
            let stateUser;
            const { state } = req.query;
            if (state) {
              stateUser = await User.findById(state);
              if (!stateUser) {
                return cb({ msg: 'User Id Not Found!' });
              }
            }
            const profileUser = await User.findOne({
              linkedAccounts: {
                $elemMatch: {
                  accountId: profile.id,
                  type: SocialAccountTypesEnum.GOOGLE
                }
              }
            });
            if (profileUser) {
              if (req.query.state) {
                if (profileUser._id.toString() !== (state as string)) {
                  return cb({
                    msg: 'Account Mismatch'
                    // ids: [profileUser._id, req.query.state],
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
                  type: SocialAccountTypesEnum.GOOGLE,
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
                    type: SocialAccountTypesEnum.GOOGLE,
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
