import { addCarriersData, addStationsData } from '../../../add-data';

const interceptor = async (options: SearchTrainOptions, data: any) => {
  const segments = [];

  for (const item of data.data) {
    const { route: routes } = item;

    if (options.tripType === 'oneway') {
      for (const route of item.route) {
        const { flyFrom, flyTo, airline, operating_carrier } = route;

        segments.push({
          origin: flyFrom,
          destination: flyTo,
          marketingCarrier: airline,
          operatingCarrier:
            operating_carrier.length > 0 ? operating_carrier : airline
        });
      }
    } else {
      for (const route of routes) {
        const { flyFrom, flyTo, airline, operating_carrier } = route;

        segments.push({
          origin: flyFrom,
          destination: flyTo,
          marketingCarrier: airline,
          operatingCarrier:
            operating_carrier.length > 0 ? operating_carrier : airline
        });
      }
    }
  }

  const { stations, dumpStations } = await addStationsData(
    options.language,
    'kiwi',
    segments
  );

  const { carriers, dumpCarriers } = await addCarriersData(
    options.language,
    'kiwi',
    segments
  );

  return {
    data,
    stations,
    carriers,
    dumpStations,
    dumpCarriers
  };
};

export default interceptor;
