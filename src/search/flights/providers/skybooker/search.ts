import axios from 'axios';
import xml2js from 'xml2js';
import moment from 'moment';
import logger from '../../../../configs/logger';

const parser = new xml2js.Parser();

const { SKYBOOKER_API_USERNAME, SKYBOOKER_API_PASSWORD } = process.env;

const ConvertLegs = (legs: SearchOptionLeg[]): string => {
  let flightLegs = '';

  for (const leg of legs) {
    const departure = moment.utc(leg.departure).format('DDMMYY');

    flightLegs += `
      <Segment>
        <DepartLocation Type="Airport">${leg.origin}</DepartLocation>
        <ArriveLocation Type="Airport">${leg.destination}</ArriveLocation>
        <Depart>${departure}</Depart>
      </Segment>`;
  }

  return flightLegs;
};

const transformOpions = (options: SearchOptions) => {
  const { currency, adults, children, infants, cabinClass } = options;

  return {
    legs: ConvertLegs(options.legs),
    cabinClass,
    currency,
    adults,
    children,
    infants
  };
};

const search = async (input: SearchOptions) => {
  const options = transformOpions(input);
  const payload = `
    <?xml version="1.0" encoding="UTF-8"?>
      <DataRequestQuery>
        <Authenticate For="SearchMultiFlights">
          <Username>${SKYBOOKER_API_USERNAME}</Username>
          <Password>${SKYBOOKER_API_PASSWORD}</Password>
        </Authenticate>
        <SearchMultiFlights CabinClass="${options.cabinClass}" FlexibleDates="false">
          <FlightSegments>${options.legs}</FlightSegments>
          <Passengers>
            <Adult>${options.adults}</Adult>
            <Child>${options.children}</Child>
            <Infant>${options.infants}</Infant>
          </Passengers>
        </SearchMultiFlights>
      </DataRequestQuery>`;

  const data = await axios
    .post('https://www.flightomart.com/api/v1_0/index.php', payload, {
      headers: {
        'Content-Type': 'text/xml'
      }
    })
    .then((res) => res.data)
    .then((xmlResponse) => parser.parseStringPromise(xmlResponse))
    .then((jsonResponse) => {
      if (
        !jsonResponse.SearchFlights_Response ||
        !jsonResponse.SearchFlights_Response.FlightResult ||
        jsonResponse.SearchFlights_Response.FlightResult.length === 0
      ) {
        return {};
      } else {
        return jsonResponse.SearchFlights_Response.FlightResult;
      }
    })
    .catch((error) => {
      logger.error(error);
      return {};
    });

  return data;
};

export default search;
