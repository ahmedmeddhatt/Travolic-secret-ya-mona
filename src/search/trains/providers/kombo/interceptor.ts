import { addStationsData, addCarriersData } from '../../../add-data';

const interceptor = async (options: SearchTrainOptions, data: any) => {
  const segments = [];
  if (options.tripType == 'oneway') {
    for (const item of data.trips) {
      segments.push({
        origin: item.segments[0][0]['departureStationId'],
        destination: item.segments[0][0]['arrivalStationId'],
        marketingCarrier: item.segments[0][0]['companyId'],
        operatingCarrier: item.segments[0][0]['companyId']
      });
    }
    const { stations, dumpStations } = await addStationsData(
      options.language,
      'kombo',
      segments
    );

    const { carriers, dumpCarriers } = await addCarriersData(
      options.language,
      'kombo',
      segments
    );
    return {
      data,
      stations,
      dumpStations,
      carriers,
      dumpCarriers
    };
  } else {
    for (const item of data.outBoundData.trips) {
      segments.push({
        origin: item.segments[0][0]['departureStationId'],
        destination: item.segments[0][0]['arrivalStationId'],
        marketingCarrier: item.segments[0][0]['companyId'],
        operatingCarrier: item.segments[0][0]['companyId']
      });
    }
    for (const item of data.inBoundData.trips) {
      segments.push({
        origin: item.segments[0][0]['departureStationId'],
        destination: item.segments[0][0]['arrivalStationId'],
        marketingCarrier: item.segments[0][0]['companyId'],
        operatingCarrier: item.segments[0][0]['companyId']
      });
    }

    const { stations, dumpStations } = await addStationsData(
      options.language,
      'kombo',
      segments
    );

    const { carriers, dumpCarriers } = await addCarriersData(
      options.language,
      'kombo',
      segments
    );
    return {
      data,
      stations,
      dumpStations,
      carriers,
      dumpCarriers
    };
  }
};

export default interceptor;
