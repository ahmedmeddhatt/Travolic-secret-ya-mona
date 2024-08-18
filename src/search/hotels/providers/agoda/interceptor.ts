import { addHotelsData } from '../../../add-data';
const interceptor = async (options: SearchHotelOptions, data: any) => {
  const providerName = 'agoda';
  const { hotelsData, dumpHotels } = await addHotelsData(
    options.language,
    providerName,
    options.hotelsData
  );

  return {
    data,
    hotelsData,
    dumpHotels
  };
};

export default interceptor;
