import { addCarriersData, addStationsData } from '../../../add-data';

const interceptor = async (options: SearchTrainOptions, data: any) => {
  const segments = [];

  for (const trip of data) {
    for (const outboundJourney of trip.legs) {
      const {
        trName,
        fromLng,
        fromLat,
        toLng,
        toLat,
        fromTz,
        toTz,
        fromIdSya,
        toIdSya
      } = outboundJourney;

      segments.push({
        origin: fromIdSya,
        destination: toIdSya,
        marketingCarrier: trName,
        operatingCarrier: trName,
        fromLat: Number(fromLat),
        fromLng: Number(fromLng),
        toLat: Number(toLat),
        toLng: Number(toLng),
        fromTimezone: fromTz,
        toTimezone: toTz
      });
    }

    if (trip.legs_rT) {
      for (const inboundJourney of trip.legs_rT) {
        const {
          trName,
          fromLng,
          fromLat,
          toLng,
          toLat,
          trNum,
          fromTz,
          toTz,
          fromIdSya,
          toIdSya
        } = inboundJourney;

        segments.push({
          origin: fromIdSya,
          destination: toIdSya,
          marketingCarrier: trName,
          operatingCarrier: trName,
          marketingFlightNumber: trNum,
          fromLat: Number(fromLat),
          fromLng: Number(fromLng),
          toLat: Number(toLat),
          toLng: Number(toLng),
          fromTimezone: fromTz,
          toTimezone: toTz
        });
      }
    }
  }

  const { stations, dumpStations } = await addStationsData(
    options.language,
    'combigo',
    segments
  );

  const { carriers, dumpCarriers } = await addCarriersData(
    options.language,
    'combigo',
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
