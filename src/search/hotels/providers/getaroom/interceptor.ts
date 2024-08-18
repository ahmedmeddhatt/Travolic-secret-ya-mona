import { addHotelsData } from '../../../add-data';
const interceptor = async (options: SearchHotelOptions, data: any) => {
  const providerName = 'goglobal';
  const hotelsIDS = ['48133', '426'];

  /*
      Get Hotels IDS From Giata
   */

  const { hotelsData, dumpHotels } = await addHotelsData(
    options.language,
    providerName,
    hotelsIDS
  );

  return {
    data,
    hotelsData,
    dumpHotels
  };
};

export default interceptor;
