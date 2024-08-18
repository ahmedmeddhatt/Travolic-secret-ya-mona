import { Request, Response } from 'express';
import { createHash } from 'crypto';
import getIPData from '../utils/ipData.util';
import uuid from 'uuid';

import { UserSearch } from '../models';
import {
  searchProviderParamsSchema,
  searchRequestparamsSchema,
  shareFlightByEmailAuth,
  shareFlightByEmailUnAuth
} from '../validators/flight.schema';
import { shareFlightTemplate } from '../utils/mailer/templates/flight-share.template';
import { MailerService } from '../services/mailer.service';
import {
  searchProvider as searchFlightProvider,
  searchProviderWithoutToken as searchFlightProviderWithoutToken,
  searchInit,
  searchProviderFromCityToCity as searchFlightProviderFromCityToCity,
  searchProviderWithoutTokenFromCityToCity as searchFlightProviderWithoutTokenFromCityToCity,
  searchInitV2
} from '../search/flights/search';
import searchWithSearchID from '../search/search-with-searchId';
import {
  flightSearchTracking,
  flight90SearchTracking,
  flightSearchTracking2
} from '../track';
import logger from '../configs/logger';
import {
  searchNomadInit,
  searchProvider as searchFlightNomadProvider,
  searchProviderWithoutToken as searchNomadFlightProviderWithoutToken
} from '../search/nomads/search';
import elasticsearch from '../configs/elasticsearch';
import moment from 'moment';

const prepareOptions = async (req: Request) => {
  const { country_code, location } = await getIPData(
    req.ip,
    req.body.visitorId,
    req.user ? req.user._id : null
  );
  const { searchId } = req.params;
  if (searchId) req.body.searchId = searchId;
  return {
    ...req.body,
    logId: createHash('sha256').digest('hex'),
    userData: {
      ip: req.ip,
      location,
      country_code,
      ...(req.user ? { _id: req.user._id } : {})
    }
  };
};

export const initSearch = async (req: Request, res: Response) => {
  const options = await prepareOptions(req);
  const initSearchResult = await searchInit(options);
  const { searchId } = initSearchResult;
  await flightSearchTracking(searchId, {
    ...options,
    source: req.headers.source as string,
    deviceInfo: req.headers.deviceinfo as string,
    devicePlatform: req.headers.deviceplatform as string,
    devicePlatformName: req.headers.deviceplatformname as string,
    deviceVersion: req.headers.deviceversion as string,
    deviceType: req.headers.devicetype as string
  });

  if (req.user) {
    const userSearchDoc = new UserSearch({
      userId: req.user.id,
      searchOptions: options,
      searchId,
      endpoint: `/search/init`,
      method: 'POST',
      type: 'Flights'
    });

    await userSearchDoc.save();
  }

  return res.send(initSearchResult);
};
export const initSearchV2 = async (req: Request, res: Response) => {
  const options = await prepareOptions(req);
  const initSearchResult = await searchInitV2(options);
  const { searchId, searchEndpoints } = initSearchResult;
  const payloadsResults = [];
  searchEndpoints.map(async (item) => {
    payloadsResults.push(item['payload']);

    if (req.user) {
      const userSearchDoc = new UserSearch({
        userId: req.user.id,
        searchOptions: item['payload'],
        searchId,
        endpoint: `/search/init/v2`,
        method: 'POST',
        type: 'Flights'
      });

      await userSearchDoc.save();
    }
  });
  await flightSearchTracking2(searchId, {
    payloadsResults,
    source: req.headers.source as string,
    deviceInfo: req.headers.deviceinfo as string,
    devicePlatform: req.headers.deviceplatform as string,
    devicePlatformName: req.headers.deviceplatformname as string,
    deviceVersion: req.headers.deviceversion as string,
    deviceType: req.headers.devicetype as string
  });
  return res.send(initSearchResult);
};

export const searchProviderWithoutToken = async (
  req: Request,
  res: Response
) => {
  const { error } = searchProviderParamsSchema.validate(req.params);
  if (error) {
    return res.status(422).json({
      status: 'fail',
      message: error.details[0].message
    });
  }
  try {
    const { provider } = req.params;

    const options = await prepareOptions(req);

    const searchResult = await searchFlightProviderWithoutToken(
      provider,
      options,
      req.ip
    );

    return res.status(200).json(searchResult);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Un-handled Error' });
  }
};

export const searchProvider = async (req: Request, res: Response) => {
  const { error } = searchProviderParamsSchema.validate(req.params);
  if (error) {
    return res.status(422).json({
      status: 'fail',
      message: error.details[0].message
    });
  }
  const { provider } = req.params;
  try {
    const options = await prepareOptions(req);
    const searchResult = await searchFlightProvider(provider, options, req.ip);
    return res.status(200).json(searchResult);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ error: 'Un-handled Error' });
  }
};

export const searchRequestId = async (req: Request, res: Response) => {
  const { error, value } = searchRequestparamsSchema.validate(req.params);

  if (error) {
    return res.status(422).json({
      status: 'fail',
      message: error.details[0].message
    });
  }

  const searchResult = await searchWithSearchID(value.requestId);

  return res.status(200).json(searchResult);
};

export const shareFlight = async (req: Request, res: Response) => {
  let shareMailOptions: any = {};

  if (req.user) {
    const { error, value } = shareFlightByEmailAuth.validate(req.query);
    const { to, link } = value;
    const { email, firstName, lastName } = req.user;

    if (error) {
      return res.status(422).json({
        status: 'fail',
        message: error.details[0].message
      });
    }

    shareMailOptions = {
      to,
      from: email,
      fullName: `${firstName} ${lastName}`,
      link
    };
  } else {
    const { error, value } = shareFlightByEmailUnAuth.validate(req.query);
    const { to, from, fullName, link } = value;

    if (error) {
      return res.status(422).json({
        status: 'fail',
        message: error.details[0].message
      });
    }

    shareMailOptions = { to, from, fullName, link };
  }

  const mailer = new MailerService();
  const sent = await mailer.send({
    subject: 'Share Flight link',
    to: shareMailOptions.to,
    text: `Your friend shared flight with you`,
    html: shareFlightTemplate(shareMailOptions)
  });

  if (!sent) {
    return res.status(500).json({
      status: 'fail',
      message: 'Error sending email'
    });
  }

  return res.status(200).json({ success: true });
};

export const initNomadProvider = async (req: Request, res: Response) => {
  const options = await prepareOptions(req);
  const initSearchResult = await searchNomadInit(options);
  const { searchId } = initSearchResult;

  await flightSearchTracking(searchId, {
    ...options,
    source: req.headers.source as string,
    deviceInfo: req.headers.deviceinfo as string,
    devicePlatform: req.headers.deviceplatform as string,
    devicePlatformName: req.headers.deviceplatformname as string,
    deviceVersion: req.headers.deviceversion as string,
    deviceType: req.headers.devicetype as string
  });

  if (req.user) {
    const userSearchDoc = new UserSearch({
      userId: req.user.id,
      searchOptions: options,
      searchId,
      endpoint: `/searchNomad/init`,
      method: 'POST',
      type: 'FlightsNomad'
    });

    await userSearchDoc.save();
  }

  return res.send(initSearchResult);
};

export const searchNomadProvider = async (req: Request, res: Response) => {
  const { error } = searchProviderParamsSchema.validate(req.params);
  if (error) {
    return res.status(422).json({
      status: 'fail',
      message: error.details[0].message
    });
  }
  const { provider } = req.params;
  try {
    const options = await prepareOptions(req);
    const searchResult = await searchFlightNomadProvider(provider, options);
    return res.status(200).json(searchResult);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ error: 'Un-handled Error' });
  }
};

export const searchNomadProviderWithoutToken = async (
  req: Request,
  res: Response
) => {
  const { error } = searchProviderParamsSchema.validate(req.params);
  if (error) {
    return res.status(422).json({
      status: 'fail',
      message: error.details[0].message
    });
  }
  try {
    const { provider } = req.params;

    const options = await prepareOptions(req);

    const searchResult = await searchNomadFlightProviderWithoutToken(
      provider,
      options
    );

    return res.status(200).json(searchResult);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Un-handled Error' });
  }
};

export const flight90TrackSearch = async (req: Request, res: Response) => {
  const options = await prepareOptions(req);
  const searchId = uuid.v4();
  await flight90SearchTracking(searchId, {
    ...options,
    source: req.headers.source as string,
    deviceInfo: req.headers.deviceinfo as string,
    devicePlatform: req.headers.deviceplatform as string,
    devicePlatformName: req.headers.deviceplatformname as string,
    deviceVersion: req.headers.deviceversion as string,
    deviceType: req.headers.devicetype as string
  });

  return res.status(200).json({
    message: 'Done'
  });
};

export const trackFlight90Source = async (req, res) => {
  try {
    if (!elasticsearch) {
      return res.status(500).json({
        message: 'Elasticsearch is not configured properly'
      });
    }

    const { source } = req.body;

    const data = await elasticsearch.index({
      index: 'flight90_source',
      body: {
        source,
        timestamp: moment.utc().format()
      }
    });

    if (data) {
      return res.status(200).json({
        message: 'Data saved successfully'
      });
    } else {
      return res.status(500).json({
        message: 'Failed to save data in Elasticsearch'
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: 'An error occurred while saving data to Elasticsearch'
    });
  }
};

export const searchProviderFromCityToCity = async (
  req: Request,
  res: Response
) => {
  const { error } = searchProviderParamsSchema.validate(req.params);
  if (error) {
    return res.status(422).json({
      status: 'fail',
      message: error.details[0].message
    });
  }
  const { provider } = req.params;
  try {
    const options = await prepareOptions(req);
    const searchResult = await searchFlightProviderFromCityToCity(
      provider,
      options
    );
    return res.status(200).json(searchResult);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ error: 'Un-handled Error' });
  }
};
export const searchProviderWithoutTokenFromCityToCity = async (
  req: Request,
  res: Response
) => {
  const { error } = searchProviderParamsSchema.validate(req.params);
  if (error) {
    return res.status(422).json({
      status: 'fail',
      message: error.details[0].message
    });
  }
  try {
    const { provider } = req.params;

    const options = await prepareOptions(req);

    const searchResult = await searchFlightProviderWithoutTokenFromCityToCity(
      provider,
      options
    );

    return res.status(200).json(searchResult);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Un-handled Error' });
  }
};
