import axios from 'axios';
import xml2js from 'xml2js';
import currencyMap from './currency';
import logger from '../../../../configs/logger';

const parser = new xml2js.Parser();

const classMap: IDictionary<string> = {
  Economy: 'EC',
  Premium_Economy: 'BZ'
};

const transformOpions = (options: SearchOptions) => {
  const {
    currency = 'EGP',
    adults = 1,
    children = 0,
    infants = 0,
    cabinClass = 'Economy'
  } = options;

  return {
    legs: ConvertLegs(options.legs),
    cabinClass: classMap[cabinClass],
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

  const currency = currencyMap[input.legs[0].origin];

  if (!currency) {
    options.currency = 'USD';
  } else {
    options.currency = currency;
  }

  const signaturePayload = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:web="http://schemas.navitaire.com/WebServices" xmlns:ses="http://schemas.navitaire.com/WebServices/ServiceContracts/SessionService" xmlns:ses1="http://schemas.navitaire.com/WebServices/DataContracts/Session">
    <soapenv:Header>
    </soapenv:Header>
    <soapenv:Body>
       <ses:LogonRequest>
          <ses:logonRequestData>
             <ses1:DomainCode>EXT</ses1:DomainCode>
              <ses1:AgentName>AEG2100000</ses1:AgentName>
              <ses1:Password>dMDJcP+S2:UB</ses1:Password>
          </ses:logonRequestData>
       </ses:LogonRequest>
    </soapenv:Body>
 </soapenv:Envelope>`;

  const signature = await axios
    .post(
      'https://trprodr4xapi.navitaire.com/SessionManager.svc',
      signaturePayload,
      {
        headers: {
          'Content-Type': 'text/xml;charset=utf-8',
          SoapAction:
            'http://schemas.navitaire.com/WebServices/ISessionManager/Logon'
        }
      }
    )
    .then((response) => response.data)
    .then((xmlResponse) => parser.parseStringPromise(xmlResponse))
    .then((parsed) => {
      if (!parsed['s:Envelope']) return {};
      return parsed['s:Envelope']['s:Body'];
    })
    .catch((err) => {
      logger.error(err);
      return {};
    });

  if (Object.keys(signature).length === 0) {
    return {};
  }

  const signatureKey = signature[0].LogonResponse[0].Signature[0];

  const payload = `
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
   <s:Header>
      <h:ContractVersion xmlns:h="http://schemas.navitaire.com/WebServices">0</h:ContractVersion>
      <h:EnableExceptionStackTrace xmlns:h="http://schemas.navitaire.com/WebServices">false</h:EnableExceptionStackTrace>
      <h:MessageContractVersion i:nil="true" xmlns:h="http://schemas.navitaire.com/WebServices" xmlns:i="http://www.w3.org/2001/XMLSchema-instance"></h:MessageContractVersion>
      <h:Signature xmlns:h="http://schemas.navitaire.com/WebServices">${signatureKey}</h:Signature>
   </s:Header>
   <s:Body>
      <GetLowFareTripAvailabilityRequest xmlns="http://schemas.navitaire.com/WebServices/ServiceContracts/BookingService">
         <LowFareTripAvailabilityRequest xmlns="http://schemas.navitaire.com/WebServices/DataContracts/Booking" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
            <BypassCache>false</BypassCache>
            <IncludeTaxesAndFees>true</IncludeTaxesAndFees>
            <GroupBydate>false</GroupBydate>
            <ParameterSetID>0</ParameterSetID>
            <CurrencyCode>${options.currency}</CurrencyCode>
            <SourceOrganizationCode i:nil="true"></SourceOrganizationCode>
            <PaxResidentCountry>${input.country}</PaxResidentCountry>
            <PromotionCode i:nil="true"></PromotionCode>
            <LowFareAvailabilityRequestList>
               ${options.legs}
            </LowFareAvailabilityRequestList>
            <BookingClassList i:nil="true" xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays"></BookingClassList>
            <ProductClassList i:nil="true" xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays"></ProductClassList>
            <FareTypeList i:nil="true" xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays"></FareTypeList>
            <LoyaltyFilter>MonetaryOnly</LoyaltyFilter>
            <FlightFilter>AllFlights</FlightFilter>
            <AlternateLowFareRequestList i:nil="true"></AlternateLowFareRequestList>
            <GetAllDetails>true</GetAllDetails>
            <PaxCount>${
              options.children + options.adults + options.infants
            }</PaxCount>
            <PaxPriceTypeList>
               <PaxPriceType>
                  <PaxType>ADT</PaxType>
                  <PaxDiscountCode i:nil="true"></PaxDiscountCode>
                  <PaxCount>1</PaxCount>
               </PaxPriceType>
               <PaxPriceType>
                  <PaxType>CHD</PaxType>
                  <PaxDiscountCode i:nil="true"></PaxDiscountCode>
                  <PaxCount>1</PaxCount>
               </PaxPriceType>
            </PaxPriceTypeList>
            <MaximumConnectingFlights>0</MaximumConnectingFlights>
            <OptimizationInputParameterList i:nil="true"></OptimizationInputParameterList>
         </LowFareTripAvailabilityRequest>
      </GetLowFareTripAvailabilityRequest>
   </s:Body>
</s:Envelope>`;

  const results = await axios
    .post('https://trprodr4xapi.navitaire.com/BookingManager.svc', payload, {
      headers: {
        'Content-Type': 'text/xml;charset=utf-8',
        SoapAction:
          'http://schemas.navitaire.com/WebServices/IBookingManager/GetLowFareTripAvailability'
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
        <LowFareAvailabilityRequest>
        <DepartureStationList xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
            <a:string>${leg.origin}</a:string>
        </DepartureStationList>
        <ArrivalStationList xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
            <a:string>${leg.destination}</a:string>
        </ArrivalStationList>
        <BeginDate>${leg.departure}</BeginDate>
        <EndDate>${leg.departure}</EndDate>
    </LowFareAvailabilityRequest>
        `;
  }

  return flightLegs;
};

export default search;
