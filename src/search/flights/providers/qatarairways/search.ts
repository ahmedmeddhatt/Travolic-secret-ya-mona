import axios from 'axios';
import xml2js from 'xml2js';
import crypto from 'crypto';
import logger from '../../../../configs/logger';

const { QATAR_AIRWAY_SEARCH_API_URL, QATAR_AIRWAY_PASSWORD } = process.env;
const parser = new xml2js.Parser();

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

const createPasswordDigist = (password: string) => {
  const timestamp = new Date().toISOString();
  const nonceInput = Math.floor(
    Math.random() * Math.floor(10000000)
  ).toString();

  // file deepcode ignore InsecureHash: <please specify a reason of ignoring this>
  const nonce = crypto.createHash('md5').update(nonceInput).digest();
  const nonceHash = nonce.toString('base64');
  const passwordDigest = crypto
    .createHash('sha1')
    .update(nonce.toString('binary'), 'ascii')
    .update(timestamp)
    .update(password)
    .digest('base64');

  return { nonceHash, passwordDigest, timestamp };
};

const search = async (input: SearchOptions) => {
  if (input.tripType === 'multi') return {};
  const options = transformOpions(input);
  const { nonceHash, timestamp, passwordDigest } = createPasswordDigist(
    QATAR_AIRWAY_PASSWORD
  );
  const Cabin = options.cabinClass;
  const payload = `<soapenv:Envelope
            xmlns:ns="http://www.opentravel.org/OTA/2003/05"
            xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
            <soapenv:Header>
            <wsse:Security soapenv:mustUnderstand="1"
            xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
            xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
                <wsse:UsernameToken wsu:Id="UsernameToken-96E1C3BCAF71D9593914139840837972">
                <wsse:Username>otaIbeService</wsse:Username>
                <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">${passwordDigest}</wsse:Password>
                <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">${nonceHash}</wsse:Nonce>
                <wsu:Created>${timestamp}</wsu:Created>
                </wsse:UsernameToken></wsse:Security>
            </soapenv:Header>
            <soapenv:Body>
             <OTA_AirLowFareSearchRQ EchoToken="50987" SequenceNmbr="1" Target="Production" Version="1.0" TimeStamp="${timestamp}"
             xmlns="http://www.opentravel.org/OTA/2003/05" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
                 <POS>
                    <Source>
                        <RequestorID ID="Syndic" MessagePassword="asoire65d$">
                            <CompanyName Code="SY">Syndic</CompanyName>
                        </RequestorID>
                    </Source>
                 </POS>
                ${options.legs}
                 <TravelPreferences>
                    <CabinPref Cabin="${Cabin}"/>
                 </TravelPreferences>
                 <TravelerInfoSummary>
                    <AirTravelerAvail>
                       <PassengerTypeQuantity Code="ADT" Quantity="${options.adults}"/>
                       <PassengerTypeQuantity Code="CHD" Quantity="${options.children}"/>
                       <PassengerTypeQuantity Code="INF" Quantity="${options.infants}"/>
                    </AirTravelerAvail>
                    <PriceRequestInformation>
                        <DiscountPricing Type="APITEST">
                        </DiscountPricing>
                    </PriceRequestInformation>
                 </TravelerInfoSummary>
              </OTA_AirLowFareSearchRQ>
            </soapenv:Body>
            </soapenv:Envelope>`;

  const results = await axios
    .post(QATAR_AIRWAY_SEARCH_API_URL, payload, {
      headers: {
        'Content-Type': 'application/xml',
        SOAPAction: 'searchAirLowFare'
      }
    })
    .then((res) => res.data)
    .then((xmlResponse) => parser.parseStringPromise(xmlResponse))
    .then((parsed) => {
      if (!parsed['soap:Envelope']) return {};

      return parsed['soap:Envelope']['soap:Body'][0].OTA_AirLowFareSearchRS[0];
    })
    .catch((err) => {
      logger.error(err);
      return {};
    });

  return results;
};

const ConvertLegs = (legs: SearchOptionLeg[]): string => {
  let flightLegs = '';
  legs.forEach((leg) => {
    flightLegs += `   <OriginDestinationInformation>
                    <DepartureDateTime>${leg.departure}</DepartureDateTime>
                    <OriginLocation LocationCode="${leg.origin}"/>
                    <DestinationLocation LocationCode="${leg.destination}"/>
                 </OriginDestinationInformation>`;
  });
  return flightLegs;
};

export default search;
