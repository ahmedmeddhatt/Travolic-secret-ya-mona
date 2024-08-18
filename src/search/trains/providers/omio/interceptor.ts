import { addCarriersData, addStationsData } from '../../../add-data';

const interceptor = async (options: SearchTrainOptions, data: any) => {
  const segments = [];

  const stationsMap = data.positions.reduce((acc: any, item: any) => {
    acc[item.id] = item;
    return acc;
  }, {});
  const carriersMap = data.carriers.reduce((acc: any, item: any) => {
    acc[item.id] = item;
    return acc;
  }, {});

  for (const segment of data.segments) {
    const { departurePositionId, arrivalPositionId, carrierId } = segment;

    const origin = stationsMap[departurePositionId];
    const destination = stationsMap[arrivalPositionId];
    const carrier = carriersMap[carrierId];

    segments.push({
      origin: origin.id,
      destination: destination.id,
      marketingCarrier: carrier.id,
      operatingCarrier: carrier.id,
      fromLat: origin.lat,
      fromLng: origin.lng,
      toLat: destination.lat,
      toLng: destination.lng
    });
  }

  const { stations, dumpStations } = await addStationsData(
    options.language,
    'omio',
    segments
  );

  const { carriers, dumpCarriers } = await addCarriersData(
    options.language,
    'omio',
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
