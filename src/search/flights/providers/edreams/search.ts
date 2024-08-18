import axios from 'axios';
import xml2js from 'xml2js';
import logger from '../../../../configs/logger';
import pos from './pos';

const parser = new xml2js.Parser();

const tripTypesMap: IDictionary<string> = {
  Economy: 'TOURIST',
  Premium_Economy: 'PREMIUM_ECONOMY',
  Business: 'BUSINESS',
  First: 'FIRST'
};

const transformOptions = (options: SearchOptions) => {
  const {
    currency,
    country,
    adults,
    children,
    infants,
    cabinClass,
    language,
    legs
  } = options;

  return {
    legs,
    cabinClass: tripTypesMap[cabinClass],
    currency,
    adults,
    children,
    infants,
    language,
    country
  };
};

const buildSegments = (legs: SearchOptionLeg[]): string => {
  let result = '';

  for (const leg of legs) {
    const { origin, destination, departure } = leg;
    result += `
      <segmentRequests date="${departure}">
        <departure iataCode="${origin}"/>
        <destination iataCode="${destination}"/>
      </segmentRequests>
    `;
  }

  return result;
};

const search = async (input: SearchOptions) => {
  if (input.tripType === 'multi') return {};
  const options = transformOptions(input);
  const posData = pos.find(
    (pos) => pos.country === options.country && pos.language === input.language
  ) || {
    language: 'en',
    domain: '.com',
    country: 'US',
    locale: 'en',
    currency: 'EUR'
  };

  const segments = buildSegments(options.legs);

  const payload = `
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:version="http://metasearch.odigeo.com/metasearch/ws/v7/">
  <soapenv:Header/>
  <soapenv:Body>
    <version:search>
      <preferences locale="${posData.locale}" realUserIP="127.0.0.1" userAgent="Mozilla/5.0 (Windows)" domainCode="${posData.domain}"/>
        <searchRequest maxSize="1000">
           <itinerarySearchRequest cabinClass="${options.cabinClass}" numAdults="${options.adults}" numChildren="${options.children}" numInfants="${options.children}">
            ${segments}
           </itinerarySearchRequest>
        </searchRequest>
        <metasearchEngineCode>8e74846de85c64c12652ccb4fb67afc6</metasearchEngineCode>
     </version:search>
  </soapenv:Body>
</soapenv:Envelope>
`;

  const results = await axios
    .post(
      'http://metasearch.odigeo.com/metasearch/ws/v7/ItinerarySearch',
      payload,
      {
        headers: {
          'Content-Type': 'application/soap+xml'
        }
      }
    )
    .then((response) => response.data)
    .then((xmlResponse) => parser.parseStringPromise(xmlResponse))
    .then((parsed) => {
      if (!parsed['soap:Envelope']) return {};
      return parsed['soap:Envelope']['soap:Body'][0];
    })
    .catch((err) => {
      logger.error(err.message);
      return {};
    });

  return results;
};

export default search;
