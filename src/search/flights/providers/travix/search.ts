import axios from 'axios';
import xml2js from 'xml2js';
import currencyMap from './currency';
import { createSelectCurrency } from '../../../../utils';
import logger from '../../../../configs/logger';

const selectCurrency = createSelectCurrency(
  [
    'CHF',
    'SDG',
    'THB',
    'HKD',
    'EUR',
    'AUD',
    'CAD',
    'DKK',
    'INR',
    'MYR',
    'NZD',
    'AED',
    'GBP',
    'USD',
    'TWD',
    'SEK',
    'ZAR',
    'SAR',
    'PHP'
  ],
  'USD'
);

const parser = new xml2js.Parser();

const classMap: IDictionary<string> = {
  Economy: 'Economy',
  Premium_Economy: 'Premium Economy',
  Business: 'Business',
  First: 'First'
};

const ConvertLegs = (legs: SearchOptionLeg[], tripType: string) => {
  let flightLegs = '';

  if (tripType === 'oneway') {
    flightLegs += `<Outbound>
            <DepartureDateTime>${legs[0].departure}</DepartureDateTime>
            <DepartureDeviationInDays>0</DepartureDeviationInDays>
            <HasTimePreference>false</HasTimePreference>
            <OriginLocation>
            <AirportCode>${legs[0].origin}</AirportCode>
            <IncludeNearbyAirports>false</IncludeNearbyAirports>
            <Latitude>0</Latitude>
            <Longitude>0</Longitude>
            </OriginLocation>
            <DestinationLocation>
            <AirportCode>${legs[0].destination}</AirportCode>
            <IncludeNearbyAirports>false</IncludeNearbyAirports>
            <Latitude>0</Latitude>
            <Longitude>0</Longitude>
            </DestinationLocation>
            </Outbound>`;
  } else if (tripType == 'round') {
    flightLegs += `<Outbound>
        <DepartureDateTime>${legs[0].departure}</DepartureDateTime>
        <DepartureDeviationInDays>0</DepartureDeviationInDays>
        <HasTimePreference>false</HasTimePreference>
        <OriginLocation>
        <AirportCode>${legs[0].origin}</AirportCode>
        <IncludeNearbyAirports>false</IncludeNearbyAirports>
        <Latitude>0</Latitude>
        <Longitude>0</Longitude>
        </OriginLocation>
        <DestinationLocation>
        <AirportCode>${legs[0].destination}</AirportCode>
        <IncludeNearbyAirports>false</IncludeNearbyAirports>
        <Latitude>0</Latitude>
        <Longitude>0</Longitude>
        </DestinationLocation>
        </Outbound>
        <Inbound>
        <DepartureDateTime>${legs[1].departure}</DepartureDateTime>
        <DepartureDeviationInDays>0</DepartureDeviationInDays>
        <HasTimePreference>false</HasTimePreference>
        <OriginLocation>
        <AirportCode>${legs[1].origin}</AirportCode>
        <IncludeNearbyAirports>false</IncludeNearbyAirports>
        <Latitude>0</Latitude>
        <Longitude>0</Longitude>
        </OriginLocation>
        <DestinationLocation>
        <AirportCode>${legs[1].destination}</AirportCode>
        <IncludeNearbyAirports>false</IncludeNearbyAirports>
        <Latitude>0</Latitude>
        <Longitude>0</Longitude>
        </DestinationLocation>
        </Inbound>`;
  }

  return flightLegs;
};

const transformOpions = (options: SearchOptions) => {
  const { currency, adults, children, infants, cabinClass, tripType, legs } =
    options;

  return {
    legs: ConvertLegs(legs, tripType),
    cabinClass: classMap[cabinClass],
    currency: selectCurrency(currency),
    adults,
    children,
    infants
  };
};

const search = async (input: SearchOptions) => {
  const options = transformOpions(input);
  const currencies = currencyMap[options.currency];

  const results = [];

  for (const currency of currencies) {
    const payload = `
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
      <soap:Header>
        <Context xmlns="http://ats.service.airtrade.nl/">
          <LanguageId>1033</LanguageId>
          <ApiUserName>${currency[0]}</ApiUserName>
          <ApiPassword>${currency[1]}</ApiPassword>
        </Context>
      </soap:Header>
      <soap:Body>
        <SearchFlights xmlns="http://ats.service.airtrade.nl/">
          <request>
            ${options.legs}
            <TravelerInfo>
              <NumberOfAdults>${options.adults}</NumberOfAdults>
              <NumberOfChildren>${options.children}</NumberOfChildren>
              <NumberOfInfants>${options.infants}</NumberOfInfants>
            </TravelerInfo>
            <TravelerPreferences>
              <AirlineCode />
              <AllianceCode />
              <NonStop>false</NonStop>
              <CabinClass>${options.cabinClass}</CabinClass>
            </TravelerPreferences>
          </request>
        </SearchFlights>
      </soap:Body>
    </soap:Envelope>`;

    const data = await axios
      .post(
        'https://travolic.meta-api.travix.com/Flightservice.asmx',
        payload,
        {
          headers: {
            'Content-Type': 'application/soap+xml'
          }
        }
      )
      .then((res) => res.data)
      .then((xmlResponse) => parser.parseStringPromise(xmlResponse))
      .then((jsonResponse) => {
        if (!jsonResponse['soap:Envelope']) return {};
        return jsonResponse['soap:Envelope']['soap:Body'];
      })
      .catch((error) => {
        logger.error(error);
        return {};
      });

    data[0].market = currency[2];

    if (currency[2] === 'Budgetair') {
      data[0].market = 'BudgetAir';
    }

    results.push(data);
  }

  return results;
};

export default search;
