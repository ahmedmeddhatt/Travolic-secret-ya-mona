import { AircraftDB } from '../models/aircraftDB';

export const getAircraftsService = async (
  page: number,
  limit: number
): Promise<any> => {
  const aircrafts = await AircraftDB.paginate(
    {},
    {
      page,
      limit
    }
  );

  return aircrafts;
};
