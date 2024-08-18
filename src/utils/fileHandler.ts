import path from 'path';
import fs from 'fs';
import multer from 'multer';

import { User, Image } from '../models';
import { Paths } from '../consts/paths';
import { ResponseHandler } from './responseHandler';
import logger from '../configs/logger';
import { slash } from './index';

export class FileHandler {
  responseHandler: ResponseHandler;
  storage: any;

  constructor() {
    this.storage = null;
    this.responseHandler = new ResponseHandler();
  }

  setStorage(storageFile) {
    return (this.storage = multer.diskStorage({
      destination: `${Paths.user.head}${storageFile}`,

      filename: function (req, file, cb) {
        cb(
          null,
          storageFile +
            '-' +
            Date.now() +
            Math.floor(Math.random() * 10000000) +
            path.extname(file.originalname)
        );
      }
    }));
  }

  checkFileExt(file, cb, fileTypes, allowAll = false) {
    if (allowAll) {
      return cb(null, true);
    }

    const filetypes = fileTypes;
    const extname = filetypes.test(
      path.extname(file.originalname).toLocaleLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    return cb('This file extenation is not allowed!', false);
  }

  async uploadSingle(req, res, fileInfo, isAvatar = true) {
    const { fileTypes } = fileInfo;
    const uploadMulter = multer({
      storage: this.setStorage(fileInfo.storagePlace),
      fileFilter: function (req, file, cb) {
        this.checkFileExt(file, cb, fileTypes, true);
      }
    }).any();
    return uploadMulter(req, res, async (err) => {
      if (err) {
        logger.error(err, 'Error in upload');

        this.responseHandler
          .setStatusCode(400)
          .setStatusMessage(fileInfo.fileError)
          .setData('No Data Returned!');
        res.send({
          ...this.responseHandler.respond()
        });
      } else {
        this.responseHandler
          .setStatusCode(200)
          .setStatusMessage('Successfully uploaded!');

        if (req.user) {
          req.files[0].uploadedBy = req.user._id;
        }

        this.responseHandler.setData(req.files[0]);

        const avatarRoute = '/' + slash(req.files[0].path);

        req.files[0].route = avatarRoute;

        if (isAvatar) {
          const { user } = req;
          await User.findByIdAndUpdate(user._id, {
            avatarUrl: avatarRoute,
            avatarImageInfo: req.files[0]
          });
        }

        return res.send({
          ...this.responseHandler.respond()
        });
      }
    });
  }

  async saveImagesResult(files) {
    const data = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const modelCreadted = await new Image({
        name: file.filename,
        path: file.path
      }).save();
      data.push(modelCreadted);
    }
    return data;
  }
  uploadMultiple(req, res, fileInfo) {
    const uploadMultiple = multer({
      storage: this.setStorage(fileInfo.storagePlace)
    }).any();
    return uploadMultiple(req, res, (err) => {
      if (err) {
        logger.error(err);
        this.responseHandler
          .setStatusCode(400)
          .setStatusMessage(fileInfo.fileError)
          .setData('No Data Returned!');
        res.send({ ...this.responseHandler.respond() });
      } else {
        this.responseHandler.setStatusCode(200).setData(req.files);
        res.send({ ...this.responseHandler.respond() });
      }
    });
  }

  async delete(pathMe, filename) {
    try {
      fs.unlink(
        path.join(__dirname, `../${Paths.user.head}/${pathMe}/${filename}`),
        (err) => {
          logger.error(err);
        }
      );
      this.responseHandler
        .setStatusCode(200)
        .setStatusMessage('Sucess Deleted')
        .setData('No Data Returned');
      return {
        ...this.responseHandler.respond()
      };
    } catch (err) {
      logger.error(err);
      return {
        ...this.responseHandler.serverError()
      };
    }
  }
}
