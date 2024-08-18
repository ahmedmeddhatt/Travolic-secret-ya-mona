import axios from 'axios';
import xml2js from 'xml2js';
import moment from 'moment';
import logger from '../../../../configs/logger';

const parser = new xml2js.Parser();

const cabinClassMap: IDictionary<string> = {
  Economy: 'Y',
  Premium_Economy: 'W',
  First: 'F',
  Business: 'C'
};

const transformOptions = (options: SearchOptions) => {
  const {
    tripType,
    currency,
    country,
    language,
    legs,
    adults,
    children,
    infants,
    cabinClass
  } = options;
  return {
    tripType,
    currency,
    country,
    language,
    legs,
    adults,
    children,
    infants,
    cabinClass: cabinClassMap[cabinClass]
  };
};

const search = async (input: SearchOptions) => {
  const options = transformOptions(input);

  if (options.tripType === 'multi') return {};

  if (options.tripType === 'oneway') {
    const payload = `
    <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
            <FlightPricer xmlns="http://tempuri.org/">
                <Origin>${options.legs[0].origin}</Origin>
                <Destination>${options.legs[0].destination}</Destination>
                <DepartureDate>${moment
                  .utc(options.legs[0].departure, 'YYYY-MM-DD')
                  .format('DD-MM-YYYY')}</DepartureDate>
                <ArrivalDate></ArrivalDate>
                <isReturn>false</isReturn>
                <_class>${options.cabinClass}</_class>
                <PreAirline>ALL</PreAirline>
                <Adults>${options.adults}</Adults>
                <Childs>${options.children}</Childs>
                <Infants>${options.infants}</Infants>
                <FNonStop>false</FNonStop>
                <isFlxDate>false</isFlxDate>
                <sessionID>087878444tyhhgg</sessionID>
                <Source>CFM_TL</Source>
            </FlightPricer>
        </soap:Body>
    </soap:Envelope>`;

    const data = await axios
      .post('http://cftltsrv.cheapfaremart.com/FlightService.asmx', payload, {
        headers: {
          Host: 'cftltsrv.cheapfaremart.com',
          'Content-Type': 'text/xml; charset=utf-8',
          SOAPAction: 'http://tempuri.org/FlightPricer'
        }
      })
      .then((res) => res.data)
      .then((xmlResponse) => {
        xmlResponse = xmlResponse.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        return parser.parseStringPromise(xmlResponse);
      })
      .then((parsed) => {
        if (!parsed['soap:Envelope']) return {};
        return parsed['soap:Envelope']['soap:Body'][0];
      })
      .catch((err) => {
        logger.error(err);
        return {};
      });

    return data;
  } else {
    const payload = `
    <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
            <FlightPricer xmlns="http://tempuri.org/">
                <Origin>${options.legs[0].origin}</Origin>
                <Destination>${options.legs[0].destination}</Destination>
                <DepartureDate>${moment
                  .utc(options.legs[0].departure, 'YYYY-MM-DD')
                  .format('DD-MM-YYYY')}</DepartureDate>
                <ArrivalDate>${moment
                  .utc(options.legs[1].departure, 'YYYY-MM-DD')
                  .format('DD-MM-YYYY')}</ArrivalDate>
                <isReturn>true</isReturn>
                <_class>${options.cabinClass}</_class>
                <PreAirline>ALL</PreAirline>
                <Adults>${options.adults}</Adults>
                <Childs>${options.children}</Childs>
                <Infants>${options.infants}</Infants>
                <FNonStop>false</FNonStop>
                <isFlxDate>false</isFlxDate>
                <sessionID>087878444tyhhgg</sessionID>
                <Source>CFM_TL</Source>
            </FlightPricer>
        </soap:Body>
    </soap:Envelope>`;

    const data = await axios
      .post('http://cftltsrv.cheapfaremart.com/FlightService.asmx', payload, {
        headers: {
          Host: 'cftltsrv.cheapfaremart.com',
          'Content-Type': 'text/xml; charset=utf-8',
          SOAPAction: 'http://tempuri.org/FlightPricer'
        }
      })
      .then((res) => res.data)
      .then((xmlResponse) => {
        xmlResponse = xmlResponse.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        return parser.parseStringPromise(xmlResponse);
      })
      .then((parsed) => {
        if (!parsed['soap:Envelope']) return {};
        return parsed['soap:Envelope']['soap:Body'][0];
      })
      .catch((err) => {
        logger.error(err);
        return {};
      });

    return data;
  }
};
export default search;
