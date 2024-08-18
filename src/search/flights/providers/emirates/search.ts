import axios from 'axios';
import xml2js from 'xml2js';
import logger from '../../../../configs/logger';

const parser = new xml2js.Parser();
const { EMIRATES_SUBSCRIPTION_KEY } = process.env;

const tripTypesMap: IDictionary<string> = {
  Economy: 'Y',
  Premium_Economy: 'W',
  Business: 'C',
  First: 'F'
};

const transformOptions = (options: SearchOptions) => {
  const {
    currency = 'EGP',
    adults = 1,
    children = 0,
    infants = 0,
    cabinClass = 'Economy'
  } = options;

  return {
    legs: ConvertLegs(options.legs),
    cabinClass: capinTypes(options.legs, tripTypesMap[cabinClass]),
    currency,
    adults,
    children,
    infants,
    pos: options.userData.country_code
  };
};

const search = async (input: SearchOptions) => {
  if (input.tripType === 'multi') return {};
  const options = transformOptions(input);
  const payload = `
    <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="http://farelogix.com/ns1" xmlns:t="http://farelogix.com/flx/t"/>
      <SOAP-ENV:Header>
        <t:TransactionControl>
          <tc>
            <iden u="Travolic" p="dOiVvbV71zyb" pseudocity="ECWT" agt="xmltv001" agtpwd="rEld5T5sjS25" agy="90490002"/>
            <agent user="cmltv001"/>
            <trace>ECWT_trav</trace>
            <script engine="FLXDM" name="travolicEKD-dispatch.flxdm"/>
          </tc>
        </t:TransactionControl>
      </SOAP-ENV:Header>
    <SOAP-ENV:Body>
    <ns1:XXTransaction>
      <REQ>
        <AirShoppingRQ Version="17.2" TransactionIdentifier="${Math.random()
          .toString(36)
          .substring(2)}">
          <Document id="document"/>
            <Party>
              <Sender>
                <TravelAgencySender>
                  <PseudoCity>ECWT</PseudoCity>
                  <AgencyID>90490002</AgencyID>
                </TravelAgencySender>
              </Sender>
            </Party>
            <Parameters>
              <Pricing>
                <OverrideCurrency>${options.currency}</OverrideCurrency>
              </Pricing>
            </Parameters>
            <CoreQuery>
              <OriginDestinations>${options.legs}</OriginDestinations>
            </CoreQuery>
            <Preference>
              <CabinPreferences>${options.cabinClass}</CabinPreferences>
            </Preference>
            <DataLists>
              <PassengerList>
                ${convertPassengerNumbers('ADT', options.adults, 1)}
                ${convertPassengerNumbers(
                  'CNN',
                  options.children,
                  options.adults
                )}
                ${convertPassengerNumbers('INF', options.infants, 1)}
              </PassengerList>
            </DataLists>
          </AirShoppingRQ>
        </REQ>
      </ns1:XXTransaction>
    </SOAP-ENV:Body>`;

  const results = await axios
    .post('https://ekd.farelogix.com/prod/oc', payload, {
      headers: {
        'Content-Type': 'application/soap+xml',
        'Ocp-Apim-Subscription-Key': EMIRATES_SUBSCRIPTION_KEY,
        SOAPAction: 'AirShoppingRQ'
      }
    })
    .then((response) => response.data)
    .then((xmlResponse) => parser.parseStringPromise(xmlResponse))
    .then((parsed) => {
      if (!parsed['SOAP-ENV:Envelope']) return {};
      return parsed['SOAP-ENV:Envelope']['SOAP-ENV:Body'];
    })
    .catch((err) => {
      logger.error(err);
      return {};
    });

  return results;
};

const capinTypes = (legs, class_code) => {
  let types = '';
  legs.forEach(function (leg, index) {
    types += `<CabinType>
<Code>${class_code}</Code>
<OriginDestinationReferences>OD${index + 1}</OriginDestinationReferences>
</CabinType>`;
  });
  return types;
};

const ConvertLegs = (legs) => {
  let flightLegs = '';
  legs.forEach(function (leg, index) {
    flightLegs += `<OriginDestination OriginDestinationKey="OD${index + 1}">
                   <Departure>
                      <AirportCode>${leg.origin}</AirportCode>
                      <Date>${leg.departure}</Date>
                   </Departure>
             <Arrival>
               <AirportCode>${leg.destination}</AirportCode>
             </Arrival>
             </OriginDestination>`;
  });
  return flightLegs;
};

const convertPassengerNumbers = (
  passengerType: string,
  passengerNumbers,
  start
) => {
  //generate adt
  let ADT = '';
  for (let i = 1; i <= passengerNumbers; i++) {
    let PassengerId = 'T' + i;
    if (passengerType === 'INF') {
      PassengerId = 'T' + i + '.1';
    } else if (passengerType === 'CNN') {
      const passenger_num = start + i;
      PassengerId = 'T' + passenger_num;
    }
    ADT += `<Passenger PassengerID="${PassengerId}">
        <PTC>${passengerType}</PTC>
      </Passenger>`;
  }
  return ADT;
};

export default search;
