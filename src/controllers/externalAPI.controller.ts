import { NextFunction, Request, Response } from 'express';
import axios from 'axios';
import uuid from 'uuid';
import moment from 'moment';
import { setJSON, getJSON, getTTL } from '../utils/cache.util';
import AppError from '../utils/appError.util';
import logger from '../configs/logger';
import Client from '../models/client';
import { searchBodySchema } from '../validators/flight.schema';
import RequestClient from '../interfaces/external.interface';
import queryString from 'query-string';

const { EXTERNAL_BASE_SITE_URL, EXTERNAL_BASE_API_URL } = process.env;
const createInitialResponse = async (searchId: string) => {
  await setJSON(
    `search-results-${searchId}`,
    {
      isCompleted: false,
      segments: {},
      legs: {},
      itineraries: {},
      airports: {},
      airlines: {},
      aircrafts: {}
    },
    {
      duration: moment.duration({
        minutes: 10
      })
    }
  );
};

const mergeData = async (
  source: TransformedResult,
  target: TransformedResult,
  searchId: string,
  options: SearchOptions,
  clientName: string
) => {
  Object.keys(target['itineraries']).forEach((key) => {
    const pricingOptions = [];
    for (const pricingOption of target['itineraries'][key]['pricingOptions']) {
      const tempPricingOption = { ...pricingOption };
      const token = pricingOption['deepLink'];
      const queryParams = queryString.stringify({
        searchId,
        token,
        visitorId: options.visitorId,
        agentName: pricingOption.agentName,
        price: pricingOption.price.amount,
        currency: options.currency,
        country: options.country,
        adults: options.adults,
        children: options.children,
        infants: options.infants,
        utm_source: clientName,
        itineraryId: key
      });
      tempPricingOption[
        'deepLink'
      ] = `${EXTERNAL_BASE_SITE_URL}/en/flights/book/?${queryParams}`;
      pricingOptions.push(tempPricingOption);
    }
    target['itineraries'][key]['pricingOptions'] = [...pricingOptions];
    if (source['itineraries'][key]) {
      source['itineraries'][key]['pricingOptions'] = [
        ...source['itineraries'][key]['pricingOptions'],
        ...target['itineraries'][key]['pricingOptions']
      ];
    } else {
      source['itineraries'][key] = target['itineraries'][key];
    }
  });
  const mergedData = {
    isCompleted: false,
    agents: { ...source['agents'], ...target['agents'] },
    segments: { ...source['segmets'], ...target['segments'] },
    legs: { ...source['legs'], ...target['legs'] },
    itineraries: { ...source['itineraries'] },
    airports: { ...source['airports'], ...target['airports'] }
  };
  return mergedData;
};

const retrieveData = async (
  searchId: string,
  source: any,
  options: SearchOptions,
  clientName
) => {
  try {
    const data = await getJSON(`search-results-${searchId}`);
    const retData = await mergeData(
      data,
      source,
      searchId,
      options,
      clientName
    );
    await setJSON(`search-results-${searchId}`, retData, {
      duration: moment.duration({
        minutes: 10
      })
    });
  } catch (err) {
    logger.error(err);
  }
};

export const initSearch = async (req: RequestClient, res: Response) => {
  req.body.passengers = [1, 0, 0];
  req.body.visitorId = uuid.v4();
  const { clientName } = req.client;
  const { error, value } = searchBodySchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.message });
  }
  if (clientName == 'Ratepunk') {
    const allowedRoutes = {
      oneway: [
        ['ATL', 'MCO'],
        ['ATL', 'LGA'],
        ['NYC', 'LON'],
        ['JFK', 'PAR'],
        ['DXB', 'LON']
      ],
      round: [
        [
          ['ATL', 'MCO'],
          ['MCO', 'ATL']
        ],
        [
          ['ATL', 'LGA'],
          ['LGA', 'ATL']
        ],
        [
          ['NYC', 'LON'],
          ['LON', 'NYC']
        ],
        [
          ['JFK', 'PAR'],
          ['PAR', 'JFK']
        ],
        [
          ['DXB', 'LON'],
          ['LON', 'DXB']
        ]
      ],
      multi: [
        [
          ['LON', 'PAR'],
          ['FRA', 'LON']
        ],
        [
          ['PAR', 'ROM'],
          ['MXP', 'PAR']
        ]
      ]
    };

    const isValidRoute = (tripType, legs) => {
      if (tripType === 'oneway') {
        return (
          legs.length === 1 &&
          allowedRoutes.oneway.some(
            (route) =>
              route[0] === legs[0].origin && route[1] === legs[0].destination
          )
        );
      } else if (tripType === 'round') {
        return (
          legs.length === 2 &&
          allowedRoutes.round.some(
            (route) =>
              route[0][0] === legs[0].origin &&
              route[0][1] === legs[0].destination &&
              route[1][0] === legs[1].origin &&
              route[1][1] === legs[1].destination
          )
        );
      } else if (tripType === 'multi') {
        return (
          legs.length > 1 &&
          allowedRoutes.multi.some((route) =>
            route.every(
              (r, index) =>
                r[0] === legs[index].origin && r[1] === legs[index].destination
            )
          )
        );
      }
      return false;
    };
    if (!isValidRoute(value.tripType, value.legs)) {
      return res.status(400).json({ message: 'Invalid route.' });
    }
  }
  const initSearchResult = await axios
    .post(`${EXTERNAL_BASE_API_URL}/search/init`, value, {
      headers: {
        'Content-Type': 'application/json',
        source: clientName
      }
    })
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err);
    });
  await createInitialResponse(initSearchResult['searchId']);
  res
    .status(200)
    .json({ status: 'success', searchId: initSearchResult['searchId'] });
  initSearchResult['searchEndpoints'].forEach(async (endpoint) => {
    const data = await axios
      .post(endpoint, value)
      .then((res) => res.data)
      .catch(() => {
        return {};
      });
    if (data && data['agents'] && Object.keys(data['agents']).length) {
      await retrieveData(initSearchResult.searchId, data, value, clientName);
    }
  });
  let remainingTime;
  // ! using RX instead of getTTL
  do {
    remainingTime = await getTTL(`search-results-${initSearchResult.searchId}`);
    if (remainingTime <= 560) {
      logger.info('done ', remainingTime);
      const results = await getJSON(
        `search-results-${initSearchResult.searchId}`
      );
      results['isCompleted'] = true;
      await setJSON(`search-results-${initSearchResult.searchId}`, results, {
        duration: moment.duration({
          minutes: 10
        })
      });
      break;
    }
  } while (remainingTime > 550);
};

export const getResults = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.params.searchId === undefined) {
    return next(new AppError('invalid searchId', 400));
  }
  const results = await getJSON(`search-results-${req.params.searchId}`);

  if (!results) {
    return res
      .status(404)
      .json({ status: 'error', message: 'no results found' });
  }
  res.status(200).json(results);
};

export const protect = async (
  req: RequestClient,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (apiKey === undefined) {
    return next(new AppError('invalid api key', 401));
  }
  try {
    const client = await Client.findOne({ apiKey });

    if (!client) {
      return res.status(401).json({ message: 'Invalid API key' });
    }
    req.client = client;
    next();
  } catch (error) {
    logger.error('Error validating API key:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
