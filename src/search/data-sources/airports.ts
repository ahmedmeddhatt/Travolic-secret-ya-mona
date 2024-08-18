import DataLoader from 'dataloader';
import { Airport } from '../../models';
import TranslationService from '../../middlewares/translation';

const getAirports = async (keys) => {
  const { language } = keys[0];
  const codes = keys.map((key) => key.code);
  let airports = await Airport.find({ code: { $in: codes } }).populate([
    {
      path: 'city',
      populate: [
        {
          path: 'country',
          populate: {
            path: 'currency'
          }
        },
        {
          path: 'state',
          populate: {
            path: 'country',
            populate: {
              path: 'currency'
            }
          }
        }
      ]
    }
  ]);
  airports = TranslationService.interceptor(language, airports);
  return codes.map((code) =>
    airports.find((result: any) => result.code === code)
  );
};

const createAirportLoader = () => {
  return new DataLoader<{ code: string; language: string }, any>((keys) =>
    getAirports(keys)
  );
};

export default createAirportLoader;
