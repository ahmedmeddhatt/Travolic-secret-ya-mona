import { Request, Response, NextFunction } from 'express';
import { sign, verify } from 'jsonwebtoken';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import jwt, { JwtPayload } from 'jsonwebtoken';

import { User, Airport } from '../models';
import { randomString } from '../utils';
import { MailerService } from '../services/mailer.service';
import { confirmCodeTemplate } from '../utils/mailer/templates/confirm-code.template';
import { splitName } from '../utils';
import { recoverPasswordTemplate } from '../utils/mailer/templates/recover-password.template';
import getIPData from '../utils/ipData.util';
import AppError from '../utils/appError.util';
import {
  registerSchema,
  confirmCodeSchema,
  loginSchema,
  loginFacebooSchema,
  resendCodeSchema,
  loginGoogleSchema
} from '../validators/auth.schema';

import { SocialAccountTypesEnum } from '../enums/social-account-types.enum';
import { welcomeTemplate } from '../utils/mailer/templates/welcome.template';

const {
  APP_SECRET,
  JWT_EXPIRES_IN,
  APP_FRONT_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLEINT_SECRET,
  APPLE_CLIENT_ID,
  APP_FRONT_URL_FLIGHT90
} = process.env;

const verifyToken = async (
  token: string,
  secret: string
): Promise<JwtPayload> => {
  try {
    const decodedToken = await jwt.verify(token, secret);
    return decodedToken as JwtPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next();
  }
  try {
    const decoded = await verifyToken(token, APP_SECRET);
    if (decoded === undefined) {
      return next;
    }
    const currentUser = await User.findById(decoded._id).select('-password');
    if (!currentUser) {
      return next();
    }
    req.user = currentUser;
  } catch (error) {
    return next();
  }
  next();
};

const gClient = new OAuth2Client({
  clientId: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLEINT_SECRET
});

const getNearbyAirport = async (ip: string): Promise<any> => {
  const { location } = await getIPData(ip, 'server');

  const airport = await Airport.findOne({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: location
        },
        $minDistance: 10,
        $maxDistance: 200.07 * 1000
      }
    }
  });

  const result = airport ? airport.code : '';

  return result;
};

const socialLogin = async (
  accountId: string,
  email: string,
  type: SocialAccountTypesEnum,
  accessToken: string,
  info: any = {},
  airport: string,
  source: string
): Promise<any> => {
  const user = await User.findOne({
    $or: [
      { email, isVerified: { $in: [true, false, null] } },
      {
        linkedAccounts: {
          $elemMatch: {
            accountId,
            type
          }
        }
      }
    ]
  });

  if (!user) {
    const newUser = await User.create({
      email,
      isVerified: true,
      password: accessToken,
      linkedAccounts: [{ accountId, type, accessToken }],
      mainAirport: airport,
      source: source,
      ...info
    });

    return newUser;
  } else {
    if (user.linkedAccounts.find((account) => account.accountId == accountId)) {
      return user;
    } else {
      const updatedUser = await User.findOneAndUpdate(
        { email, isVerified: { $in: [true, false, null] } },
        {
          $set: user.isVerified ? {} : { isVerified: true },
          $push: {
            //@ts-ignore
            linkedAccounts: { accountId, type, accessToken }
          }
        },
        { new: true }
      );

      return updatedUser;
    }
  }
};

const getToken = (req: Request): string => {
  if (
    req.headers.authorization &&
    req.headers.authorization.split(' ')[0] === 'Bearer'
  ) {
    return req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    return req.query.token as string;
  }

  return '';
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { error, value } = registerSchema.validate(req.body);
  const { email, password, confirmPassword } = value;

  if (error) return next(new AppError(error.details[0].message, 422));

  if (password !== confirmPassword) {
    return next(new AppError('Password does not match', 400));
  }

  const confirmCode = randomString(10);

  const existingUser = await User.findOne({
    email: email.toLowerCase(),
    isVerified: { $in: [true, false, null] },
    isDeleted: { $in: [true, false, null] }
  });

  if (existingUser) {
    if (!existingUser.isVerified) {
      const currentTime = new Date().getTime();
      const confirmCodeTime = existingUser.confirmCode.createdAt.getTime();
      const diff = currentTime - confirmCodeTime;

      if (diff / 1000 > 300) {
        const mailer = new MailerService();
        const sent = await mailer.send({
          subject: 'Travolic confirm email',
          to: email.toLowerCase(),
          text: 'Confirm Code',
          html: confirmCodeTemplate(confirmCode)
        });

        if (!sent) {
          return next(new AppError('Email not sent', 500));
        }

        return next(
          new AppError(
            'Account with the e-mail address already exists, but not verified yet. Confirm code is sent',
            409
          )
        );
      } else {
        return next(
          new AppError(
            'Account with the e-mail address already exists, but not verified yet',
            409
          )
        );
      }
    }

    return next(new AppError('Account with the e-mail already exists', 409));
  }

  const airport = await getNearbyAirport(req.ip);

  const user = new User({
    email: email.toLowerCase(),
    password,
    confirmCode: {
      code: confirmCode,
      createdAt: new Date()
    },
    isVerified: false,
    mainAirport: airport,
    source:
      req.hostname == 'api.travolic.com' || req.hostname == 'api.travolic.site'
        ? 'travolic'
        : 'flight90'
  });
  const mailer = new MailerService();
  const sent = await mailer.send({
    subject: 'Travolic confirm email',
    to: email.toLowerCase(),
    text: 'Confirm Code',
    html: confirmCodeTemplate(confirmCode)
  });

  if (!sent) {
    return next(new AppError('Email not sent', 500));
  }

  await user.save();

  return res.status(200).json({
    status: 'success',
    message: 'You have been successfully registered, confirm email sent'
  });
};

export const loginLocal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { error, value } = loginSchema.validate(req.body);
  const { email, password } = value;

  if (error) return next(new AppError(error.details[0].message, 422));

  const user = await User.findOne({
    email: email.toLowerCase(),
    isVerified: { $in: [true, false, null] }
  }).select('+password');

  if (!user) {
    return next(new AppError('Incorrect email or password', 401));
  }

  if (!user.password) {
    return next(new AppError('Incorrect email or password', 401));
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return next(new AppError('Incorrect email or password', 401));
  }

  if (!user.isVerified) {
    return next(
      new AppError(
        'Account with the e-mail address already exists, but not verified yet',
        401
      )
    );
  }

  user.password = undefined;
  const { ...payload } = user.toObject({ virtuals: false });
  const token = sign({ ...payload }, APP_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
  return res.status(200).json({
    status: 'success',
    payload,
    token,
    token_expires_in: JWT_EXPIRES_IN
  });
};

export const loginFacebook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { error, value } = loginFacebooSchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const { accessToken, userId } = value;

  const facebookGraphUrl = `https://graph.facebook.com/v2.11/${userId}?fields=id,name,email,picture&access_token=${accessToken}`;

  const fbProfile = await axios
    .get(facebookGraphUrl)
    .then((response) => response.data)
    .catch(() => {
      return next(new AppError('Facebook Invalid access token', 401));
    });

  const { email, name, picture } = fbProfile;
  const [firstName, lastName] = splitName(name);

  const airport = await getNearbyAirport(req.ip);
  const source =
    req.hostname == 'api.travolic.com' || req.hostname == 'api.travolic.site'
      ? 'travolic'
      : 'flight90';
  const existingUser = await User.findOne({ email });
  const isNewUser = !existingUser;

  const loggedInUser = await socialLogin(
    userId,
    email,
    SocialAccountTypesEnum.FACEBOOK,
    accessToken,
    {
      displayName: name,
      avatarUrl: picture ? picture.data.url : '',
      firstName,
      lastName
    },
    airport,
    source
  );

  const { ...payload } = loggedInUser.toObject({
    virtuals: false
  });

  const jwtToken = sign({ ...payload }, APP_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });

  return res.status(200).json({
    payload,
    isNewUser,
    token: jwtToken,
    token_expires_in: JWT_EXPIRES_IN
  });
};

export const loginGoogle = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { error, value } = loginGoogleSchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const { tokenId } = value;

  const verifiedResponse = await gClient.verifyIdToken({
    idToken: tokenId,
    audience: GOOGLE_CLIENT_ID
  });

  if (!verifiedResponse) {
    return next(new AppError('Google token not verified', 401));
  }

  const payLoad = verifiedResponse.getPayload();
  const userId = verifiedResponse.getUserId();
  const { email_verified, email, name, picture } = payLoad;

  if (!email_verified || !email) {
    return next(
      new AppError(
        'Account with the e-mail address already exists, but not verified yet',
        401
      )
    );
  }

  const [firstName, lastName] = splitName(name);

  const airport = await getNearbyAirport(req.ip);
  const source =
    req.hostname == 'api.travolic.com' || req.hostname == 'api.travolic.site'
      ? 'travolic'
      : 'flight90';

  const existingUser = await User.findOne({ email });
  const isNewUser = !existingUser;
  const loggedInUser = await socialLogin(
    userId,
    email,
    SocialAccountTypesEnum.GOOGLE,
    tokenId,
    { displayName: name, avatarUrl: picture, firstName, lastName },
    airport,
    source
  );
  const { ...payload } = loggedInUser.toObject({ virtuals: false });
  const jwtToken = sign({ ...payload }, APP_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });

  return res.status(200).json({
    status: 'success',
    payload,
    isNewUser,
    token: jwtToken,
    token_expires_in: JWT_EXPIRES_IN
  });
};

export const loginApple = async (req: Request, res: Response) => {
  try {
    const { email, fullName, identityToken } = req.body;

    const { sub: appleUserId } = await appleSignin.verifyIdToken(
      identityToken,
      {
        audience: APPLE_CLIENT_ID,
        ignoreExpiration: false
      }
    );

    if (appleUserId === req.body.appleUserId) {
      const airport = await getNearbyAirport(req.ip);
      const source =
        req.hostname == 'api.travolic.com' ||
        req.hostname == 'api.travolic.site'
          ? 'travolic'
          : 'flight90';
      const existingUser = await User.findOne({ email });
      const isNewUser = !existingUser;

      const loggedInUser = await socialLogin(
        appleUserId,
        email,
        SocialAccountTypesEnum.APPLE,
        identityToken,
        {
          displayName: `${fullName.givenName} ${fullName.familyName}`,
          firstName: fullName.givenName,
          lastName: fullName.familyName
        },
        airport,
        source
      );
      const { ...payload } = loggedInUser.toObject({ virtuals: false });
      const jwtToken = sign({ ...payload }, APP_SECRET, {
        expiresIn: JWT_EXPIRES_IN
      });

      return res.status(200).json({
        status: 'success',
        payload,
        isNewUser,
        token: jwtToken,
        token_expires_in: JWT_EXPIRES_IN
      });
    } else {
      res.status(401).json({ message: 'Unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const emailConfirmCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { error, value } = confirmCodeSchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const { email, confirmCode } = value;

  let user = await User.findOne({
    email: email.toLowerCase(),
    isVerified: { $in: [true, false, null] }
  });

  const updateFlag = user ? false : true;

  if (updateFlag) {
    user = await User.findOne({
      new_email: email.toLowerCase(),
      isVerified: { $in: [true, false, null] }
    });
  }

  if (updateFlag) {
    // Update User
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (confirmCode !== user.new_confirmCode.code) {
      return next(new AppError('Incorrect confirm code', 400));
    }

    const currentTime = new Date().getTime();
    const confirmCodeTime = user.new_confirmCode.createdAt.getTime();
    const diff = currentTime - confirmCodeTime;

    if (diff / 1000 > 300) {
      return next(new AppError('Confirm code expired', 400));
    }

    user.email = user.new_email;
    user.new_confirmCode = undefined;
    user.new_email = undefined;
    user.isVerified = true;

    await user.save();

    return res.status(200).json({ status: 'success', isVerified: true });
  } else {
    // New User
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (user.isVerified) {
      return next(new AppError('Email already verified', 400));
    }

    if (confirmCode !== user.confirmCode.code) {
      return next(new AppError('Incorrect confirm code', 400));
    }

    const currentTime = new Date().getTime();
    const confirmCodeTime = user.confirmCode.createdAt.getTime();
    const diff = currentTime - confirmCodeTime;

    if (diff / 1000 > 300) {
      return next(new AppError('Confirm code expired', 400));
    }

    user.confirmCode = undefined;
    user.isVerified = true;

    await user.save();

    return res.status(200).json({ status: 'success', isVerified: true });
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { token } = req.query;

  if (!token) {
    return next(new AppError('Token not provided', 400));
  }

  const decoded: any = verify(token as string, APP_SECRET);

  if (!decoded) {
    return next(new AppError('Invalid token', 400));
  }

  const user = await User.findOne({
    _id: decoded._id,
    isVerified: { $in: [true, false, null] }
  });

  if (!user) {
    return res.redirect(404, `${APP_FRONT_URL}/404`);
  }

  if (user.isVerified) {
    return res.redirect(`${APP_FRONT_URL}/verification/verified-already`);
  }

  user.isVerified = true;
  user.confirmCode = undefined;

  await user.save();

  const mailer = new MailerService();

  const sent = await mailer.send({
    subject: 'Welcome to Travolic',
    to: user.email,
    text: 'Welcome to Travolic',
    html: welcomeTemplate()
  });

  if (!sent) {
    return res.redirect(`${APP_FRONT_URL}/verification/failed`);
  }

  return res.redirect(`${APP_FRONT_URL}/verification/success`);
};

export const resendCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { error, value } = resendCodeSchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const email = value.email.toLowerCase();

  const user = await User.findOne({
    email,
    isVerified: { $in: [true, false, null] }
  });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user.isVerified) {
    return next(new AppError('Email already verified', 400));
  }

  const confirmCode = randomString(10);

  const mailer = new MailerService();

  const sent = await mailer.send({
    subject: 'Travolic confirm email',
    to: email,
    text: 'Resend travolic confirm link',
    html: confirmCodeTemplate(confirmCode)
  });

  if (!sent) {
    return next(new AppError('Failed to send confirm code', 500));
  }

  user.confirmCode = {
    code: confirmCode,
    createdAt: new Date()
  };

  await user.save();

  return res.status(200).json({
    status: 'success',
    message: 'Confirm code sent'
  });
};

export const recoverPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { error, value } = resendCodeSchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const email = value.email.toLowerCase();
  const user = await User.findOne({
    email,
    isVerified: { $in: [true, false, null] }
  });
  const redirectSource =
    user && user.source === 'travolic'
      ? APP_FRONT_URL
      : user && user.source === 'flight90'
      ? APP_FRONT_URL_FLIGHT90
      : APP_FRONT_URL;

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const { _id } = user;
  const token = sign({ _id }, APP_SECRET, {
    expiresIn: '1h'
  });
  const recoverLink = `${redirectSource}?recover_password=${token}&authmodal=open`;
  const mailer = new MailerService();
  const sent = await mailer.send({
    subject: 'Travolic recover password',
    to: email,
    text: 'Recover Password',
    html: recoverPasswordTemplate(recoverLink)
  });

  if (!sent) {
    return next(new AppError('Failed to send recover link', 500));
  }

  return res.status(200).json({
    status: 'success'
  });
};

export const generateTokens = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  let token = getToken(req);

  if (token === '') {
    return next(new AppError('Token not provided', 400));
  }

  const decodeDoc: any = verify(token, APP_SECRET);

  const user = await User.findOne({
    email: decodeDoc.email,
    isVerified: { $in: [true, false, null] }
  }).select('+password');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (!user.password) {
    return next(new AppError('User not found', 404));
  }

  const isMatch = await user.comparePassword(decodeDoc.password);

  if (!isMatch) {
    return next(new AppError('Password does not match', 400));
  }

  token = sign(
    { email: decodeDoc.email, password: decodeDoc.password },
    APP_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN
    }
  );

  user.password = undefined;

  return res.status(200).json({
    status: 'success',
    user,
    token,
    token_expires_in: JWT_EXPIRES_IN
  });
};
