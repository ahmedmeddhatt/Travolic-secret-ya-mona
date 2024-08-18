import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, Image, Country, UserSearch, UserFavourites } from '../models';
import {
  updateProfileSchema,
  updatePasswordSchema,
  updateEmailSchema,
  deleteAccountSchema
} from '../validators/user.schema';
import { randomString } from '../utils';
import ipData from '../utils/ipData.util';
import { PutItemInBucket } from '../utils/upload-image';
import { languageUtil } from '../utils/get-language.util';
import { MailerService } from '../services/mailer.service';
import TranslationService from '../middlewares/translation';
import AppError from '../utils/appError.util';
import { confirmCodeTemplate } from '../utils/mailer/templates/confirm-code.template';

const {
  APP_SECRET,
  JWT_EXPIRES_IN,
  GCLOUD_STORAGE_BUCKET,
  GCLOUD_STORAGE_PUBLIC_URL
} = process.env;

export const userData = async (req: Request, res: Response) => {
  const language = languageUtil(req);

  const result = await ipData(req.ip, 'server');
  let country = await Country.findOne({
    code: result.country_code
  });

  country = TranslationService.interceptor(language, [country])[0];
  res.json({
    ...result,
    country
  });
};

export const me = (req: Request, res: Response) =>
  res.status(200).json(req.user);

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const user = await User.findById(req.user._id, { password: 0 });

  if (!user) {
    return next(new AppError('401', 404));
  }

  res.status(200).json(user);
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { error, value } = updateProfileSchema.validate(req.body);

  if (error) {
    const errmsg = error.details[0].message.split(' ')[0].slice(1, -1);
    const errMap = {
      firstName: '404',
      lastName: '403',
      displayName: '402'
    };
    return next(new AppError(errMap[errmsg], 422));
  }

  const user = await User.findByIdAndUpdate(req.user._id, value, {
    new: true,
    projection: { password: 0 }
  });

  if (!user) {
    return next(new AppError('401', 404));
  }

  res.status(200).json(user);
};

export const updateEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { error, value } = updateEmailSchema.validate(req.body);

  if (error) {
    return next(new AppError('405', 422));
  }

  const { email } = value;

  if (email == req.user.email) {
    return next(new AppError('405', 422));
  }

  const mailFound = await User.findOne({ email });

  if (mailFound) {
    return next(new AppError('405', 422));
  }

  const confirmCode = randomString(6);
  const mailer = new MailerService();
  const sent = await mailer.send({
    subject: 'Travolic confirm email',
    to: req.body.email,
    text: 'confirm Code',
    html: confirmCodeTemplate(confirmCode)
  });

  if (!sent) {
    return next(new AppError('407', 500));
  }

  const user = await User.findByIdAndUpdate(req.user._id, {
    new_email: req.body.email,
    new_confirmCode: {
      code: confirmCode,
      createdAt: new Date()
    }
  }).select('-password');
  return res.status(200).json({
    user,
    token: jwt.sign(user.toObject({ virtuals: true }), APP_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    })
  });
};

export const updatePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { error, value } = updatePasswordSchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const { newPassword, confirmPassword } = value;

  const user = await User.findById(req.user._id);

  if (newPassword !== confirmPassword) {
    return next(new AppError('Password does not match', 422));
  }

  const isMatch = await user.comparePassword(newPassword);

  if (isMatch) {
    return next(new AppError('Password already exists', 422));
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: true });

  const { ...payload } = user.toObject();

  res.status(200).json({
    user: payload,
    token: jwt.sign(payload, APP_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    })
  });
};

export const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  if (req.user.id !== req.params.userId) {
    return next(
      new AppError('You are not authorized to perform this action', 403)
    );
  }

  const user = await User.findById(req.user._id);

  user.isDeleted = true;
  await User.deleteOne({ _id: req.user._id });
  await UserFavourites.deleteMany({ userId: req.user._id });
  await UserSearch.deleteMany({ userId: req.user._id });
  return res.status(200).json({ deleted: true });
};

export const retrieveAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { error, value } = deleteAccountSchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const { password } = value;
  const user = await User.findOne({
    _id: req.params.userId,
    isDeleted: true
  });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return next(new AppError('Password does not match', 422));
  }

  user.isDeleted = false;
  const userSaved = await user.save();

  return res.status(200).json(userSaved);
};

export const uploadAvatar = async (
  req: Request,
  res: Response
): Promise<any> => {
  const user = await User.findById(req.user._id);

  const content: Buffer = req.file.buffer;
  const data = await PutItemInBucket(user._id, content, {
    path: 'images/users'
  });

  const imageDoc = await Image.findOne({
    pathWithFilename: data.pathWithFilename
  });

  const url = `${GCLOUD_STORAGE_PUBLIC_URL}/${GCLOUD_STORAGE_BUCKET}/${data.pathWithFilename}`;

  if (!imageDoc) {
    const newImage = await Image.create(data);

    user.image = newImage._id;
    user.avatarUrl = url;

    await user.save();
  }

  return res.json({
    status: 'success',
    message: 'Image uploaded successfully',
    url
  });
};
