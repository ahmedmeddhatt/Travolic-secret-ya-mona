import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

const storage = multer.memoryStorage();

export const singleImage =
  (name: string) => (req: Request, res: Response, next: NextFunction) => {
    const upload = multer({ storage }).single(name);

    upload(req, res, (err) => {
      if (
        err instanceof multer.MulterError &&
        err.code === 'LIMIT_UNEXPECTED_FILE'
      ) {
        throw new Error('Cannot Upload More Than 1 Image');
      }

      if (err) throw err;
      next();
    });
  };
