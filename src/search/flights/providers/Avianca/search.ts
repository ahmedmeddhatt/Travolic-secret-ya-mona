import axios from 'axios';
import xml2js from 'xml2js';
import pos from './pos';
import logger from '../../../../configs/logger';

const parser = new xml2js.Parser();
const { AVIANCA_PRODUCTION_SUBSCRIPTION_KEY } = process.env;

const classMap: IDictionary<string> = {
  Economy: 'ECO',
  Business: 'BUS'
};

const transformOpions = (options: SearchOptions) => {
  const { currency, adults, children, infants, cabinClass, country, tripType } =
    options;

  return {
    legs: ConvertLegs(options.legs),
    cabinClass: classMap[cabinClass],
    currency,
    adults,
    children,
    country,
    infants,
    tripType,
    pos: options.userData.country_code
  };
};

const search = async (input: SearchOptions) => {
  const options = transformOpions(input);

  const exceptMarket = ['PA', 'GT', 'SV', 'PE', 'UY', 'BO', 'CW', 'AE'];

  if (exceptMarket.includes(options.country)) {
    options.currency = 'USD';
  }

  const posData = pos.find(
    (item) =>
      item.currency === options.currency && item.country === options.country
  );
  if (!posData || options.tripType === 'multi') {
    return {};
  }
  const payload = `
    <ns:AirShoppingRQ xmlns:ns="http://www.iata.org/IATA/EDIST" Version="2016.2" >
    <ns:Party>
    <ns:Sender>
    <ns:TravelAgencySender>
    <ns:AgencyID>${posData.ID}</ns:AgencyID>
    </ns:TravelAgencySender>
   </ns:Sender>
    </ns:Party>
   <ns:Travelers>
    <ns:Traveler>
    <ns:AnonymousTraveler>
    <ns:PTC Quantity="${options.adults}">ADT</ns:PTC>
    </ns:AnonymousTraveler>
    <ns:AnonymousTraveler>
    <ns:PTC Quantity="${options.children}">CHD</ns:PTC>
    </ns:AnonymousTraveler>
    <ns:AnonymousTraveler>
    <ns:PTC Quantity="${options.infants}">INF</ns:PTC>
    </ns:AnonymousTraveler>
    </ns:Traveler>
    </ns:Travelers>
   <ns:CoreQuery>
    <ns:OriginDestinations>
        ${options.legs}
    </ns:OriginDestinations>
    </ns:CoreQuery>
   <ns:Preference>
    <ns:CabinPreferences>
    <ns:CabinType>
    <ns:Code>${options.cabinClass}</ns:Code>
    </ns:CabinType>
    </ns:CabinPreferences>
    </ns:Preference>
   <ns:Parameters>
    <ns:Pricing>
    <ns:OverrideCurrency>${options.currency}</ns:OverrideCurrency>
    </ns:Pricing>
    </ns:Parameters>
   </ns:AirShoppingRQ>`;

  const results = await axios
    .post('https://apis.airpricing.net/ndc/airshopping', payload, {
      headers: {
        'Content-Type': 'application/xml',
        'Ocp-Apim-Subscription-Key': AVIANCA_PRODUCTION_SUBSCRIPTION_KEY
      }
    })
    .then((response) => response.data)
    .then((xmlResponse) => parser.parseStringPromise(xmlResponse))
    .catch((error) => {
      logger.error(error);
      return {};
    });

  return results;
};

const ConvertLegs = (legs: SearchOptionLeg[]): string => {
  let flightLegs = '';

  for (const leg of legs) {
    flightLegs += `
        <ns:OriginDestination>
    <ns:Departure>
    <ns:AirportCode>${leg.origin}</ns:AirportCode>
   <ns:Date>${leg.departure}</ns:Date>
    </ns:Departure>
   <ns:Arrival>
    <ns:AirportCode>${leg.destination}</ns:AirportCode>
    </ns:Arrival>
    </ns:OriginDestination>`;
  }

  return flightLegs;
};

export default search;
