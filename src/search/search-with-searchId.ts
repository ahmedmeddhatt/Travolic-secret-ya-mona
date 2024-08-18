import * as cache from '../utils/cache.util';

const getReqesetResults = async (
  searchId: string
): Promise<CollectedResults> => {
  const cachedData = await cache.getJSON(`search-results-${searchId}`);
  return cachedData as CollectedResults;
};

const searchWithId = async (searchId: string) => {
  const results = await getReqesetResults(searchId);

  if (!results) {
    return {
      completed: true,
      error: true
    };
  }

  return results;
};

export default searchWithId;
