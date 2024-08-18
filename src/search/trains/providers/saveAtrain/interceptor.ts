import { addCarriersData, addStationsData } from '../../../add-data';

const interceptor = async (options: SearchTrainOptions, data: any) => {
  const segments = [];

  if (Object.keys(data).length === 0 || data.errors) {
    return {
      data,
      stations: {},
      carriers: {},
      dumpStations: {},
      dumpCarriers: {}
    };
  }

  const { outbound, inbound } = data.result;

  for (const trip of outbound) {
    const { origin_station, destin_station, operator, connections, changes } =
      trip;

    if (changes + 1 !== operator.trim().split(',').length) continue;

    if (changes === 0) {
      segments.push({
        origin: origin_station,
        destination: destin_station,
        marketingCarrier: operator.trim(),
        operatingCarrier: operator.trim()
      });
    } else {
      const splittedConnections = connections.split(',');
      const splittedOperators = operator.trim().split(',');

      for (let i = 0; i < changes; i++) {
        if (i === 0) {
          segments.push({
            origin: origin_station.trim(),
            destination: splittedConnections[i].trim(),
            marketingCarrier: splittedOperators[i].trim(),
            operatingCarrier: splittedOperators[i].trim()
          });
        } else if (changes === i + 1) {
          segments.push({
            origin: splittedConnections[i].trim(),
            destination: destin_station.trim(),
            marketingCarrier: splittedOperators[i].trim(),
            operatingCarrier: splittedOperators[i].trim()
          });
        } else {
          segments.push({
            origin: splittedConnections[i].trim(),
            destination: splittedConnections[i + 1].trim(),
            marketingCarrier: splittedOperators[i].trim(),
            operatingCarrier: splittedOperators[i].trim()
          });
        }
      }
    }
  }

  if (inbound) {
    for (const trip of inbound) {
      const { origin_station, destin_station, operator, connections, changes } =
        trip;

      if (changes + 1 !== operator.trim().split(',').length) continue;

      if (changes === 0) {
        segments.push({
          origin: origin_station,
          destination: destin_station,
          marketingCarrier: operator.trim(),
          operatingCarrier: operator.trim()
        });
      } else {
        const splittedConnections = connections.split(',');
        const splittedOperators = operator.trim().split(',');

        for (let i = 0; i < changes; i++) {
          if (i === 0) {
            segments.push({
              origin: origin_station.trim(),
              destination: splittedConnections[i].trim(),
              marketingCarrier: splittedOperators[i].trim(),
              operatingCarrier: splittedOperators[i].trim()
            });
          } else if (changes === i + 1) {
            segments.push({
              origin: splittedConnections[i].trim(),
              destination: destin_station.trim(),
              marketingCarrier: splittedOperators[i].trim(),
              operatingCarrier: splittedOperators[i].trim()
            });
          } else {
            segments.push({
              origin: splittedConnections[i].trim(),
              destination: splittedConnections[i + 1].trim(),
              marketingCarrier: splittedOperators[i].trim(),
              operatingCarrier: splittedOperators[i].trim()
            });
          }
        }
      }
    }
  }

  const { stations, dumpStations } = await addStationsData(
    options.language,
    'saveatrain',
    segments
  );

  const { carriers, dumpCarriers } = await addCarriersData(
    options.language,
    'saveatrain',
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
