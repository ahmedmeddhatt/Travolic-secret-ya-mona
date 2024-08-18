import xml2js from 'xml2js';
import axios from 'axios';
import {
  supportedCountries,
  supportedCurrencies,
  supportedLanguages
} from './POS';

const parser = new xml2js.Parser({
  explicitArray: false,
  explicitCharkey: true
});

const {
  MYCHEAPFLIGHTTICKETS_URL,
  MYCHEAPFLIGHTTICKETS_AUTH_USERNAME,
  MYCHEAPFLIGHTTICKETS_AUTH_PASSWORD
} = process.env;

const cabinClassMap = {
  Economy: 'E',
  Premium_Economy: 'P',
  Business: 'B',
  First: 'F'
};

const TripTypeMap = {
  round: 'R',
  oneway: 'O'
};

const convertLegs = (legs: SearchOptionLeg[], tripType) => {
  let searchLegs = `<OutboundFlight>
      <Departure>${legs[0].origin}</Departure>
      <Destination>${legs[0].destination}</Destination>
      <Date>${legs[0].departure}</Date>
    </OutboundFlight>`;

  if (tripType === 'round') {
    searchLegs += `<InboundFlight>
        <Departure>${legs[1].origin}</Departure>
        <Destination>${legs[1].destination}</Destination>
        <Date>${legs[1].departure}</Date>
      </InboundFlight>`;
  }

  return searchLegs;
};

const convertPassengerNumbers = (
  passengerNum: number,
  passengerType: string
): string => {
  let passengers = '';
  for (let i = 0; i < passengerNum; i++) {
    passengers += `<Passenger Type="${passengerType}" />`;
  }

  return passengers;
};

const transformOptions = (options: SearchOptions) => {
  const { currency, adults, children, infants, cabinClass, country, tripType } =
    options;

  return {
    legs: convertLegs(options.legs, tripType),
    cabinClass: cabinClassMap[cabinClass],
    currency: supportedCurrencies[currency] ?? supportedCurrencies['default'],
    adults: convertPassengerNumbers(adults, 'adult'),
    children: convertPassengerNumbers(children, 'child'),
    infants: convertPassengerNumbers(infants, 'infant'),
    country,
    tripType: TripTypeMap[tripType]
  };
};

const search = async (input: SearchOptions) => {
  if (
    input.tripType === 'multi' ||
    !supportedCountries.includes(input.country) ||
    !supportedLanguages.includes(input.language)
  )
    return {};
  const options = transformOptions(input);

  let urlCountryCode: string;
  if (options.country === 'GB') {
    urlCountryCode = 'uk';
  }

  const payload = `<?xml version="1.0" encoding="utf-8" ?>
  <FlightSearchReq xmlns="http://vibe.travel">
    ${options.legs}
    <Passengers>
      ${options.adults}
      ${options.children}
      ${options.infants}
    </Passengers>
    <JourneyType>${options.tripType}</JourneyType>
    <CabinClass>${options.cabinClass}</CabinClass>
  </FlightSearchReq>`;

  const Authorization =
    'Basic ' +
    Buffer.from(
      MYCHEAPFLIGHTTICKETS_AUTH_USERNAME +
        ':' +
        MYCHEAPFLIGHTTICKETS_AUTH_PASSWORD
    ).toString('base64');
  const URL = `${MYCHEAPFLIGHTTICKETS_URL}.${urlCountryCode.toLowerCase()}/api/v17/search/flight`;

  async function fetchAndConvert() {
    try {
      const response = await axios.post(URL, payload, {
        headers: {
          Authorization,
          'Content-Type': 'application/xml',
          Accept: 'application/xml',
          'Accept-Encoding': 'gzip'
        }
      });
      if (response.status !== 200) {
        return {};
      }
      if (!response.data) {
        return {};
      }
      const xmlResponse = response.data;
      try {
        const result = await parser.parseStringPromise(xmlResponse);
        return result;
      } catch (err) {
        return {};
      }
    } catch (err) {
      return {};
    }
  }

  return fetchAndConvert();
};

export default search;
