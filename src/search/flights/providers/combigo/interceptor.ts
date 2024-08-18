import moment from 'moment';
import { addCarriersData, addStationsData } from '../../../add-data';

const { FLIGHT_PROVIDERS_COMBINATION } = process.env;

const interceptor = async (options: SearchOptions, data: any) => {
  const segments = [];
  const allowed = FLIGHT_PROVIDERS_COMBINATION.split(',').includes('combigo')
    ? true
    : false;

  if (allowed) {
    for (const trip of data.results) {
      if (trip['legs']) {
        for (const outboundJourney of trip['legs']) {
          const {
            dTime,
            aTime,
            trIATA,
            trId,
            trName,
            type,
            fromIATA,
            trNum,
            toIATA,
            fromIdSya,
            toIdSya,
            fromLng,
            fromLat,
            toLng,
            toLat,
            fromTz,
            toTz
          } = outboundJourney;

          const vehicleType =
            type === 'PLANE' ? 'FLIGHT' : type === 'TRAIN' ? 'TRAIN' : 'BUS';

          segments.push({
            origin: vehicleType === 'FLIGHT' ? fromIATA : fromIdSya,
            destination: vehicleType === 'FLIGHT' ? toIATA : toIdSya,
            departure: moment.utc(dTime).format('YYYYMMDDHHmm'),
            arrival: moment.utc(aTime).format('YYYYMMDDHHmm'),
            operatingCarrier: type === 'PLANE' ? trIATA : trName,
            marketingCarrier: type === 'PLANE' ? trIATA : trName,
            marketingFlightNumber: trNum ? trNum : trId,
            vehicleType,
            fromLat: Number(fromLat),
            fromLng: Number(fromLng),
            toLat: Number(toLat),
            toLng: Number(toLng),
            fromTimezone: fromTz,
            toTimezone: toTz
          });
        }
      }

      if (trip['legs_rT']) {
        for (const inboundJourney of trip['legs_rT']) {
          const {
            dTime,
            aTime,
            trIATA,
            trId,
            type,
            fromIATA,
            trNum,
            toIATA,
            fromIdSya,
            toIdSya,
            fromLat,
            fromLng,
            toLat,
            toLng,
            fromTz,
            toTz,
            trName
          } = inboundJourney;

          const vehicleType =
            type === 'PLANE' ? 'FLIGHT' : type === 'TRAIN' ? 'TRAIN' : 'BUS';

          segments.push({
            origin: vehicleType === 'FLIGHT' ? fromIATA : fromIdSya,
            destination: vehicleType === 'FLIGHT' ? toIATA : toIdSya,
            departure: moment.utc(dTime).format('YYYYMMDDHHmm'),
            arrival: moment.utc(aTime).format('YYYYMMDDHHmm'),
            marketingCarrier: type === 'PLANE' ? trIATA : trName,
            operatingCarrier: type === 'PLANE' ? trIATA : trName,
            marketingFlightNumber: trNum ? trNum : trId,
            vehicleType,
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
  } else {
    return {
      data,
      stations: {},
      carriers: {},
      dumpStations: {},
      dumpCarriers: {}
    };
  }
};

export default interceptor;
