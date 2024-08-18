import DataLoader from 'dataloader';
import { Station } from '../../models';
import TranslationService from '../../middlewares/translation';

const getStations = async (keys) => {
  const { language } = keys[0];
  const codes = keys.map((key) => key.code);
  let stations = await Station.find({ code: { $in: codes } });
  stations = TranslationService.interceptor(language, stations);
  return codes.map((code) =>
    stations.find((result: any) => result.code === code)
  );
};

const createStationLoader = () => {
  return new DataLoader<{ code: string; language: string }, any>((keys) =>
    getStations(keys)
  );
};

export default createStationLoader;
