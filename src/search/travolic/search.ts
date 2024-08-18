import axios from 'axios';
import moment from 'moment';
import * as cache from '../../utils/cache.util';

const TRAVOLIC_SEARCH_API_URL = 'https://api.travolic.com/search';

export async function searchTravolic(
  options: SearchOptions
): Promise<{ requestId; completed }> {
  const result = [];
  const searchPage = await axios.post(`${TRAVOLIC_SEARCH_API_URL}`, options);
  result.push(searchPage.data.requestId);
  const { requestId, completed } = searchPage.data;
  return { requestId, completed };
}

export async function getPageDetails(requestId: string, maxRetries = 5) {
  let res: any = {};
  let retries = 0;
  let flag = false;

  while (!flag && retries < maxRetries) {
    res = await (
      await axios.get(`${TRAVOLIC_SEARCH_API_URL}/${requestId}`)
    ).data;
    flag = res.completed;
    retries++;
  }
  return res;
}

export async function searchPriceAlert(options: SearchOptions) {
  const result: any = {
    requestIds: [],
    itineraries: {},
    legs: {},
    segments: {}
  };
  const { requestId } = await searchTravolic(options);
  result.requestId = requestId;
  const pageDetails = await getPageDetails(requestId);
  if (process.env.NODE_ENV !== 'prod') {
    cache.setJSON(`search-results-${requestId}`, pageDetails, {
      duration: moment.duration({
        minutes: 8
      })
    });
  }
  return pageDetails;
}
