import { Request, Response } from 'express';
import { createHash } from 'crypto';
import getIPData from '../utils/ipData.util';
import { UserSearch } from '../models';
import { searchTransferInit, searchProvider } from '../search/transfers/search';
import { transferSearchTracking } from '../track';

const prepareOptions = async (req: Request) => {
  const { location, country_code } = await getIPData(
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

export const initTransferSearch = async (req: Request, res: Response) => {
  const options = await prepareOptions(req);
  const initSearchResult = await searchTransferInit(options);
  const { searchId } = initSearchResult;

  await transferSearchTracking(searchId, {
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
      endpoint: `/searchTrasfer/init`,
      method: 'POST',
      type: 'Transfers'
    });

    await userSearchDoc.save();
  }

  return res.send(initSearchResult);
};

export const searchTransferProvider = async (req: Request, res: Response) => {
  const { provider } = req.params;
  const { ip, country_code } = await getIPData(req.ip, 'server');
  const logId = createHash('sha256').digest('hex');

  const requestOptions: SearchTransfersOptions = {
    ...req.body,
    logId,
    userData: {
      ip,
      country_code: country_code,
      ...(req.user ? { _id: req.user._id } : {})
    }
  };

  const searchResult = await searchProvider(provider, requestOptions);

  return res.status(200).json(searchResult);
};
