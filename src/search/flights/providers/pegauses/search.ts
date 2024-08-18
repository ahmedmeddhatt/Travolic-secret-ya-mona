import axios from 'axios';
import xml2js from 'xml2js';
import logger from '../../../../configs/logger';

const parser = new xml2js.Parser();
const { PEGASUS_PASSWORD, PEGASUS_USERNAME } = process.env;

const classMap: IDictionary<string> = {
  Economy: 'Y',
  Premium_Economy: 'Y',
  Business: 'C',
  First: 'F'
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
    cabinClass: capinTypes(options.legs, classMap[cabinClass]),
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
  const payload = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns="http://www.iata.org/IATA/EDIST/2017.2">
  <soapenv:Header/>
  <soapenv:Body>
  <AirShoppingRQ Version="IATA2017.2" xsi:schemaLocation="xmldsig-core-schema.xsd"
              xmlns="http://www.iata.org/IATA/EDIST/2017.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
   <Document>
       <Name>HITIT NDC GATEWAY</Name>
       <ReferenceVersion>1.0</ReferenceVersion>
   </Document>
   <Party>
       <Sender>
           <TravelAgencySender>
               <Contacts>
                   <Contact>
                       <EmailContact>
                           <Address>craneNDC@flypgs.com</Address>
                       </EmailContact>
                   </Contact>
               </Contacts>
               <AgencyID>PC NDC</AgencyID>
               <AgentUser>
                   <Name>HITITADMIN</Name>
                   <AgentUserID>690TD55</AgentUserID>
                   <UserRole>ADMIN</UserRole>
               </AgentUser>
           </TravelAgencySender>
       </Sender>
   </Party>
   <Parameters>
       <Languages>
           <LanguageCode>${input.language}</LanguageCode>
       </Languages>
       <CurrCodes>
           <FiledInCurrency>
               <CurrCode>${input.currency}</CurrCode>
           </FiledInCurrency>
       </CurrCodes>
   </Parameters>
   <CoreQuery>
       <OriginDestinations>
           ${options.legs}
       </OriginDestinations>
   </CoreQuery>
   <Preference>
       <CabinPreferences>
           <CabinType>
               <Code>Eco</Code>
           </CabinType>
       </CabinPreferences>
   </Preference>
   <DataLists>
       <PassengerList>
         ${convertPassengerNumbers(input.adults, input.children, input.infants)}
       </PassengerList>
   </DataLists>
</AirShoppingRQ>
  </soapenv:Body>
</soapenv:Envelope>
`;

  const results = await axios
    .post('https://ndc.flypgs.com:443/CraneNDC/CraneNDCService', payload, {
      headers: {
        'Content-Type': 'text/xml;charset=utf-8',
        username: PEGASUS_USERNAME,
        password: PEGASUS_PASSWORD
      }
    })
    .then((res) => res.data)
    .then((xmlResponse) => parser.parseStringPromise(xmlResponse))
    .then((parsed) => {
      if (!parsed['S:Envelope']) return {};

      return parsed['S:Envelope']['S:Body'];
    })
    .catch((err) => {
      logger.error(err);
      return {};
    });

  return results;
};

const capinTypes = (legs, class_code) => {
  let capinTypes = '';
  legs.forEach(function (leg, index) {
    capinTypes += `<CabinType>
<Code>${class_code}</Code>
<OriginDestinationReferences>OD${index + 1}</OriginDestinationReferences>
</CabinType>`;
  });
  return capinTypes;
};

const ConvertLegs = (legs) => {
  let flightLegs = '';
  legs.forEach(function (leg) {
    flightLegs += `
        <OriginDestination>
        <Departure>
            <AirportCode>${leg.origin}</AirportCode>
            <Date>${leg.departure}</Date>
        </Departure>
        <Arrival>
            <AirportCode>${leg.destination}</AirportCode>
        </Arrival>
    </OriginDestination>
        `;
  });
  return flightLegs;
};

const convertPassengerNumbers = (adults, children, infants) => {
  //generate adt
  let ADT = '';
  let count = 1;
  for (let i = 1; i <= adults; i++) {
    ADT += `<Passenger PassengerID="${'SH' + i}">
        <PTC>ADT</PTC>
    </Passenger>`;
    count += 1;
  }
  if (children > 0) {
    for (let i = count; i <= adults + children; i++) {
      ADT += `<Passenger PassengerID="${'SH' + i}">
              <PTC>CHD</PTC>
          </Passenger>`;
      count += 1;
    }
  }
  if (infants > 0) {
    for (let i = count; i <= adults + children + infants; i++) {
      ADT += `<Passenger PassengerID="${'SH' + i}">
              <PTC>CHD</PTC>
          </Passenger>`;
      count += 1;
    }
  }

  return ADT;
};

export default search;
