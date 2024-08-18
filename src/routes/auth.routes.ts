import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { User } from '../models';
import {
  register,
  loginLocal,
  loginFacebook,
  loginGoogle,
  loginApple,
  emailConfirmCode,
  verifyEmail,
  resendCode,
  recoverPassword
} from '../controllers/auth.controller';
import { userData } from '../controllers/user.controller';
import JWTStrategy from '../services/strategies/jwt.strategy';

const authEndpoints = (app: Router) => {
  app.use(passport.initialize());
  app.get('/user-data', userData);

  app.post('/auth/register', register);

  app.post('/auth/login', loginLocal);

  app.post('/auth/login-facebook', loginFacebook);

  app.post('/auth/login-google', loginGoogle);

  app.post('/auth/login-apple', loginApple);

  app.get(
    '/auth/facebook',
    passport.authenticate('facebook', {
      scope: ['public_profile', 'email']
    })
  );

  app.get(
    '/auth/facebook/callback',
    passport.authenticate('facebook', {
      session: false,
      passReqToCallback: true,
      successRedirect: '/',
      failureRedirect: '/'
    }),
    JWTStrategy.generateUserToken
  );

  app.get(
    '/auth/facebook/callback/delete',
    passport.authenticate('facebook', {
      session: false,
      passReqToCallback: true
    }),
    async (req: Request, res: Response) => {
      if (!req.user || !req.user.isVerified) {
        return res.status(401).json('Unauthorized');
      }

      await User.findByIdAndRemove(req.user._id);

      return res.json({ success: true, isDeleted: true });
    }
  );

  app.route('/auth/facebook/:id').get(
    (req: Request, res: Response, next: NextFunction) =>
      passport.authenticate('facebook', {
        state: req.params.id
      })(req, res, next),
    JWTStrategy.generateUserToken
  );

  app.get(
    '/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get(
    '/auth/google/callback',
    passport.authenticate('google', {
      session: false,
      passReqToCallback: true,
      failureRedirect: '/',
      successRedirect: '/profile',
      failureFlash: true,
      successFlash: 'Successfully logged in!'
    }),
    JWTStrategy.generateUserToken
  );

  app.route('/auth/google/:id').get(
    (req: Request, res: Response, next: NextFunction) =>
      passport.authenticate('google', {
        state: req.params.id
      })(req, res, next),
    JWTStrategy.generateUserToken
  );

  app.post('/auth/confirm-code', emailConfirmCode);

  app.get('/auth/verify-email', verifyEmail);

  app.post('/auth/resend-code', resendCode);

  app.post('/auth/recover-password', recoverPassword);

  return app;
};

export default authEndpoints;
