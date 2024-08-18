import { Request, Response } from 'express';
import { createHash } from 'crypto';
import getIPData from '../utils/ipData.util';
import { UserSearch } from '../models';
import { searchProviderParamsSchema } from '../validators/flight.schema';
import { searchHotelInit } from '../search/hotels/search';
import { searchProvider } from '../search/hotels/search';
import { searchProviderWithoutToken } from '../search/hotels/search';

const prepareOptions = async (req: Request) => {
  const { country_code, location } = await getIPData(
    req.ip,
    req.body.visitorId,
    req.user ? req.user._id : null
  );

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

export const initHotelSearch = async (req: Request, res: Response) => {
  const options = await prepareOptions(req);
  const initSearchResult = await searchHotelInit(options);
  const { searchId } = initSearchResult;

  // await hotelSearchTracking(searchId, {
  //   ...options,
  //   source: req.headers.source as string,
  //   deviceInfo: req.headers.deviceinfo as string,
  //   devicePlatform: req.headers.deviceplatform as string,
  //   devicePlatformName: req.headers.deviceplatformname as string,
  //   deviceVersion: req.headers.deviceversion as string,
  //   deviceType: req.headers.devicetype as string
  // });

  if (req.user) {
    const userSearchDoc = new UserSearch({
      userId: req.user.id,
      searchOptions: options,
      searchId,
      endpoint: `/searchHotel/init`,
      method: 'POST',
      type: 'Hotels'
    });

    await userSearchDoc.save();
  }

  return res.send(initSearchResult);
};

export const searchHotelProvider = async (req: Request, res: Response) => {
  const { error } = searchProviderParamsSchema.validate(req.params);

  if (error) {
    return res.status(422).json({
      status: 'fail',
      message: error.details[0].message
    });
  }

  const { provider } = req.params;

  const options = await prepareOptions(req);
  const searchResult = await searchProvider(provider, options);

  return res.status(200).json(searchResult);
};

export const searchHotelProviderWithoutToken = async (
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

  const options = await prepareOptions(req);
  const searchResult = await searchProviderWithoutToken(provider, options);

  return res.status(200).json(searchResult);
};
