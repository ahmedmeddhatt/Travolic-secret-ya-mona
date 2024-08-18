import axios from 'axios';
import xml2js from 'xml2js';
import logger from '../../../../configs/logger';

const parser = new xml2js.Parser();

const classMap: IDictionary<string> = {
  Economy: 'Y',
  Premium_Economy: 'Y',
  Business: 'C',
  First: 'F'
};

const transformOpions = (options) => {
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
  const payload = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <IATA_AirShoppingRQ xmlns="http://www.iata.org/IATA/2015/00/2019.2/IATA_AirShoppingRQ">
        <Party>
            <Sender>
                <EnabledSystem>
                    <SystemID>TRAVOLIC</SystemID>
                </EnabledSystem>
            </Sender>
        </Party>
        <Request>
            <FlightCriteria>
                ${options.legs}
            </FlightCriteria>
            <Paxs>
                <Pax>
                    <PaxID>PX1</PaxID>
                    <PTC>ADT</PTC>
                </Pax>
                <Pax>
                    <PaxID>PX2</PaxID>
                    <PTC>CHD</PTC>
                </Pax>
                <Pax>
                    <PaxID>PX3</PaxID>
                    <PTC>INF</PTC>
                </Pax>
            </Paxs>
            <ResponseParameters>
                <CurParameter>
                    <RequestedCurCode>${options.currency}</RequestedCurCode>
                </CurParameter>
            </ResponseParameters>
            <ShoppingCriteria>
                <CabinTypeCriteria>
                    <CabinTypeCode>ECONOMY</CabinTypeCode>
                </CabinTypeCriteria>
                <ConnectionCriteria>
                    <ConnectionPrefID>CP</ConnectionPrefID>
                    <MaximumConnectionQty>1</MaximumConnectionQty>
                    <StationCriteria />
                </ConnectionCriteria>
                <FareCriteria>
                <FareBasisCode>SUNECO</FareBasisCode>
                <FareBasisCode>SUNCLASSIC</FareBasisCode>
                <FareBasisCode>SUNPREMIUM</FareBasisCode>
                <PrefLevel />
            </FareCriteria>
            </ShoppingCriteria>
        </Request>
    </IATA_AirShoppingRQ>
`;

  const results = await axios
    .post('https://api.ndc.one/xq/19_2/shopping/flight', payload, {
      headers: {
        'Content-Type': 'application/xml',
        Authorization: 'Basic dHJhdm9saWM6SGhoXzAxMDA='
      }
    })
    .then((response) => response.data)
    .then((xmlResponse) => parser.parseStringPromise(xmlResponse))
    .then((parsed) => {
      if (!parsed['IATA_AirShoppingRS']) return {};

      return parsed['IATA_AirShoppingRS']['Response'];
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
  legs.forEach(function (leg, index) {
    flightLegs += `
        <SpecificOriginDestCriteria>
                    <DestStationCode>${leg.destination}</DestStationCode>
                    <OriginDestID>${'OD' + index + 1}</OriginDestID>
                    <OriginStationCode>${leg.origin}</OriginStationCode>
                    <PaxJourney>
                        <PaxJourneyID>${'PJ' + index + 1}</PaxJourneyID>
                        <PaxSegment>
                            <Arrival>
                                <IATA_LocationCode>${
                                  leg.destination
                                }</IATA_LocationCode>
                            </Arrival>
                            <Dep>
                                <AircraftScheduledDateTime>${
                                  leg.departure + 'T00:00:00'
                                }</AircraftScheduledDateTime>
                                <IATA_LocationCode>${
                                  leg.origin
                                }</IATA_LocationCode>
                            </Dep>
                            <MarketingCarrierInfo>
                                <CarrierDesigCode>XQ</CarrierDesigCode>
                                <MarketingCarrierFlightNumberText>OPEN</MarketingCarrierFlightNumberText>
                            </MarketingCarrierInfo>
                            <PaxSegmentID>${'SEG' + index + 1}</PaxSegmentID>
                        </PaxSegment>
                    </PaxJourney>
                </SpecificOriginDestCriteria>
        `;
  });
  return flightLegs;
};

export default search;
