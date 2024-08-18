import elasitcsearch from '../../configs/elasticsearch';
import logger from '../../configs/logger';

export const trackRedirectFailure = async (
  redirectId: string,
  data: RedirectsTrackData
): Promise<any> => {
  try {
    if (!elasitcsearch) return null;

    await elasitcsearch.index({
      index: 'redirect_failures',
      id: redirectId,
      body: data
    });
  } catch (e) {
    logger.error(e.body);
  }
};

export const trackRedirectHotelFailure = async (
  redirectId: string,
  data: HotelRedirectsTrackData
): Promise<any> => {
  try {
    if (!elasitcsearch) return null;

    await elasitcsearch.index({
      index: 'redirect_failures',
      id: redirectId,
      body: data
    });
  } catch (e) {
    logger.error(e.body);
  }
};
