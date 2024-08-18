import axios from 'axios';
import xml2js from 'xml2js';
import logger from '../../../../configs/logger';
import posData from './pos';

const { TRAVEL_START_SEARCH_API } = process.env;
const parser = new xml2js.Parser();

const ConvertLegs = (legs: SearchOptionLeg[]) => {
  let flightLegs = '';
  legs.forEach(function (leg, index) {
    flightLegs += `<OriginDestinationInformation RefNumber="${index}">
                <DepartureDateTime>${leg.departure}T00:00:00CAT</DepartureDateTime>
                <OriginLocation LocationCode="${leg.origin}" CodeContext="iata"
                />
                <DestinationLocation LocationCode="${leg.destination}" CodeContext="iata"
                />
            </OriginDestinationInformation>`;
  });
  return flightLegs;
};

const transformOpions = (options: SearchOptions) => {
  const {
    currency = 'EGP',
    adults = 1,
    children = 0,
    infants = 0,
    cabinClass = '' + 'Economy'
  } = options;

  return {
    legs: ConvertLegs(options.legs),
    cabinClass,
    currency,
    adults,
    children,
    infants,
    pos: options.userData.country_code
  };
};

const search = async (input: SearchOptions) => {
  if (input.tripType === 'multi') return {};
  const options = transformOpions(input);

  if (!(options.pos in posData)) return {};

  const payload = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
xmlns="http://www.opentravel.org/OTA/2003/05">
      <soapenv:Header/>
      <soapenv:Body>
        <OTA_AirLowFareSearchRQ TimeStamp="${new Date().toISOString()}"
        Target="Production" Version="1.0"
        PrimaryLangID="en" AltLangID="en"
        RetransmissionIndicator="false" xmlns="http://www.opentravel.org/OTA/2003/05">
          <POS>
            <Source ISOCountry="${options.pos}" ISOCurrency="${
    options.currency
  }"
            DisplayCurrency="${options.currency}" DisplayRate="1.0">
              <RequestorID Type="Company" ID="website"
              ID_Context="ts" MessagePassword="${
                posData[options.pos].password
              }">
                <CompanyName>${posData[options.pos].user_name}</CompanyName>
              </RequestorID>
            </Source>
          </POS>
          ${options.legs}
          <TravelPreferences>
            <CabinPref Cabin="${options.cabinClass}" />
          </TravelPreferences>
          <TravelerInfoSummary>
            <AirTravelerAvail>
              <PassengerTypeQuantity Code="7" Quantity="${options.infants}"/>
              <PassengerTypeQuantity Code="8" Quantity="${options.children}"/>
              <PassengerTypeQuantity Code="9" Quantity="0"/>
              <PassengerTypeQuantity Code="10" Quantity="${options.adults}"/>
            </AirTravelerAvail>
          </TravelerInfoSummary>
        </OTA_AirLowFareSearchRQ>
      </soapenv:Body>
  </soapenv:Envelope>`;

  const data = await axios
    .post(TRAVEL_START_SEARCH_API, payload, {
      headers: {
        'Content-Type': 'application/soap+xml'
      }
    })
    .then((res) => res.data)
    .then((xmlResponse) => parser.parseStringPromise(xmlResponse))
    .catch((err) => {
      logger.error(err);
      return {};
    });

  return data;
};

export default search;
