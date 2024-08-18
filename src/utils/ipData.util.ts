import moment from 'moment';
import { Schema } from 'mongoose';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { trackVisitor } from '../track';
import logger from '../configs/logger';

const fallbackIpInfo = {
  ip: '161.185.160.93',
  country_code: 'US',
  country_name: 'United States',
  region_name: 'New Jersey',
  city: 'Hoboken',
  location: [-74.04312896728516, 40.72010040283203]
};

const ipData = async (
  ip_address: string,
  id: string,
  userId?: Schema.Types.ObjectId
) => {
  const { GEOLOCATION_API_URL, GEOLOCATION_API_KEY } = process.env;
  const timestamp = moment.utc().format();

  try {
    if (ip_address === '::1') {
      return {
        ...fallbackIpInfo,
        timestamp,
        visitorId: id
      };
    }

    const client = axios.create({ baseURL: GEOLOCATION_API_URL });

    axiosRetry(client, { retries: 3 });

    const { data } = await client.get(
      `/${ip_address}?key=${GEOLOCATION_API_KEY}`
    );

    if (data.status === 'fail') {
      return {
        ...fallbackIpInfo,
        timestamp,
        visitorId: id
      };
    }

    const { query, country, countryCode, regionName, city, lat, lon } = data;

    const result = {
      ip: query,
      country_code: countryCode,
      country_name: country,
      region_name: regionName,
      city: city,
      location: [lon, lat]
    };

    if (id !== 'server') {
      await trackVisitor({
        ...result,
        visitorId: id,
        timestamp,
        userId: userId ? String(userId) : null
      });
    }

    return {
      ...result,
      visitorId: id,
      timestamp
    };
  } catch (err) {
    logger.error(err);
    return {
      ...fallbackIpInfo,
      timestamp,
      visitorId: id
    };
  }
};

export default ipData;
