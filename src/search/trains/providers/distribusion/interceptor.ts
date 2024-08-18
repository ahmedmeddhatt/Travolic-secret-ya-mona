import { addCarriersData, addStationsData } from '../../../add-data';

const interceptor = async (options: SearchTrainOptions, data: any) => {
  const segments = [];

  const dataSegments = data.included.filter(
    (item: any) => item.type === 'segments'
  );
  const dataStations = data.included.filter(
    (item: any) => item.type === 'stations'
  );
  const stationsMap = dataStations.reduce((acc: any, item: any) => {
    acc[item.id] = item;
    return acc;
  }, {});

  for (const segment of dataSegments) {
    const origin = stationsMap[segment.relationships.departure_station.data.id];
    const destination =
      stationsMap[segment.relationships.arrival_station.data.id];

    segments.push({
      origin: origin.attributes.code,
      destination: destination.attributes.code,
      marketingCarrier: segment.relationships.marketing_carrier.data.id,
      operatingCarrier:
        segment.relationships.operating_carrier.data.id ||
        segment.relationships.marketing_carrier.data.id,
      fromLat: origin.attributes.latitude,
      fromLng: origin.attributes.longitude,
      toLat: destination.attributes.latitude,
      toLng: destination.attributes.longitude,
      fromTimezone: origin.attributes.time_zone,
      toTimezone: destination.attributes.time_zone
    });
  }

  const { stations, dumpStations } = await addStationsData(
    options.language,
    'distribusion',
    segments
  );

  const { carriers, dumpCarriers } = await addCarriersData(
    options.language,
    'distribusion',
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
