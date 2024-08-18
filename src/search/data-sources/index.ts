import createAirportLoader from './airports';
import createStationLoader from './stations';

const createLoaders = () => {
  return {
    airports: createAirportLoader(),
    stations: createStationLoader()
  };
};

export default createLoaders;
