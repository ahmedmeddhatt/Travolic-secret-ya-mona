import querystring from 'query-string';
import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import AppError from '../utils/appError.util';

const { API_KEY_DISTANCE_MATRIX } = process.env;

export const autoComplete = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { input, location } = req.query;
  const payload = {
    input: input as string,
    key: 'AIzaSyBUpJKHwOqVCQoMDQlpfzLfhkCIPWf7mwQ',
    location,
    radius: 500,
    strictBounds: true,
    types: 'establishment'
  };
  const results = await axios
    .get(
      'https://maps.googleapis.com/maps/api/place/autocomplete/json?' +
        querystring.stringify(payload),
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': req.headers['accept-language'] as string
        }
      }
    )
    .then((res) => res.data)
    .catch((err) => {
      return next(new AppError(err, 500));
    });

  return res.status(200).json(results);
};

export const placeId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { place_id, language } = req.query;
  const payload = {
    place_id: place_id as string,
    key: 'AIzaSyBUpJKHwOqVCQoMDQlpfzLfhkCIPWf7mwQ',
    language
  };
  const results = await axios
    .get(
      'https://maps.googleapis.com/maps/api/place/details/json?' +
        querystring.stringify(payload),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    .then((res) => res.data)
    .catch((err) => {
      return next(new AppError(err, 500));
    });

  return res.status(200).json(results);
};

export const distanceMatrix = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { destinations, origins } = req.query;
  const payload = {
    destinations: destinations,
    origins: origins,
    key: API_KEY_DISTANCE_MATRIX
  };
  const results = await axios
    .get(
      `https://maps.googleapis.com/maps/api/distancematrix/json?` +
        querystring.stringify(payload),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    .then((res) => res.data)
    .catch((err) => {
      return next(new AppError(err, 500));
    });

  return res.status(200).json(results);
};
