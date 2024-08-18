import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwt from 'jsonwebtoken';
import { User } from '../../models';
import logger from '../../configs/logger';

const { APP_SECRET, JWT_EXPIRES_IN } = process.env;

class JWTStrategy {
  public static init(_passport: any): any {
    try {
      _passport.use(
        new Strategy(
          {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: APP_SECRET
          },
          function (jwt_payload, done) {
            User.findOne({ _id: jwt_payload._id }, function (err, user) {
              if (err) {
                return done({ status: 401, msg: JSON.stringify(err) }, false);
              }
              if (!user) {
                return done(null, false, {
                  status: 401,
                  msg: `user not found`
                });
              }
              if (!user.isVerified) {
                return done(
                  {
                    status: 401,
                    msg: `E-mail ${user.email}  was not verified`
                  },
                  false,
                  {
                    msg: `E-mail ${user.email}  was not verified`
                  }
                );
              }

              const payloadUser = user.toObject();
              payloadUser.id = user._id.toString();
              return done(null, {
                ...payloadUser,
                password: undefined,
                confirmCode: undefined
              });
            });
          }
        )
      );
    } catch (error) {
      logger.error(error, 'jwt error');
    }
  }

  public static async generateUserToken(req, res) {
    if (!req.user || !req.user.isVerified) {
      return res.status(401).json('Unauthorized');
    }

    req.user.id = req.user._id;
    const payload = {
      id: req.user._id,
      _id: req.user._id,
      isValid: req.user.isValid
    };
    const token = await jwt.sign(payload, APP_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });
    res.json({ payload, token, token_expires_in: JWT_EXPIRES_IN });
  }
}

export default JWTStrategy;
