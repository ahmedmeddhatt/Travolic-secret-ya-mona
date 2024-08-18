import axios from 'axios';
import moment from 'moment';
import xml2js from 'xml2js';
import logger from '../../../../configs/logger';

const parser = new xml2js.Parser({
  trim: true
});
const { CONDOR_API_URL, CONDOR_API_KEY, CONDOR_USER, CONDOR_PASSWORD } =
  process.env;

const tripTypesMap: IDictionary<string> = {
  Economy: 'Y',
  Premium_Economy: 'W',
  Business: 'C'
};

const transformOptions = (options: SearchOptions) => {
  const { currency, adults, children, infants, cabinClass, country, tripType } =
    options;

  return {
    legs: ConvertLegs(options.legs, options.country),
    cabinClass: tripTypesMap[cabinClass],
    currency,
    adults,
    children,
    infants,
    country,
    tripType
  };
};

const search = async (input: SearchOptions) => {
  if (input.tripType === 'multi') return {};
  const options = transformOptions(input);
  const supportedMarkets = [
    'DE',
    'DK',
    'ES',
    'EU',
    'FR',
    'IT',
    'PL',
    'PT',
    'US'
  ];

  if (!supportedMarkets.includes(options.country)) {
    options.country = 'DE';
  }

  if (input.cabinClass === 'First') {
    return {};
  }

  const payload = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <IATA_AirShoppingRQ
  xmlns="http://www.iata.org/IATA/2015/00/2019.2/IATA_AirShoppingRQ">
      <Party>
          <Sender>
              <EnabledSystem>
                  <SystemID>81676</SystemID>
              </EnabledSystem>
          </Sender>
      </Party>
      <Request>
          <FlightCriteria>${options.legs}</FlightCriteria>
          <Paxs>
            ${convertPassengerNumbers(
              options.adults,
              options.children,
              options.infants
            )}
          </Paxs>
          <ResponseParameters>
              <CurParameter>
                  <RequestedCurCode>${options.currency}</RequestedCurCode>
              </CurParameter>
          </ResponseParameters>
          <ShoppingCriteria>
              <CabinTypeCriteria>
                  <CabinTypeCode>${options.cabinClass}</CabinTypeCode>
              </CabinTypeCriteria>
          </ShoppingCriteria>
      </Request>
  </IATA_AirShoppingRQ>`;
  const results = await axios
    .post(
      `${CONDOR_API_URL}/${options.country.toLowerCase()}/19_2/shopping/flight`,
      payload,
      {
        headers: {
          'Content-Type': 'application/xml',
          'Content-Encoding': 'gzip',
          Authorization: `Basic ${CONDOR_API_KEY}`,
          User: CONDOR_USER,
          Password: CONDOR_PASSWORD
        }
      }
    )
    .then((response) => response.data)
    .then((response) => parser.parseStringPromise(response))
    .catch((error) => {
      logger.error(error);
      return {};
    });

  return results;
};

const ConvertLegs = (legs: SearchOptionLeg[], country: string): string => {
  let flightLegs = '';
  legs.forEach(function (leg, index) {
    flightLegs += `<SpecificOriginDestCriteria>
      <DestStationCode>${leg.destination}</DestStationCode>
      <OriginDestID>OD${index + 1}</OriginDestID>
      <OriginStationCode>${leg.origin}</OriginStationCode>
      <PaxJourney>
          <PaxJourneyID>PJ${index + 1}</PaxJourneyID>
          <PaxSegment>
              <Arrival>
                  <IATA_LocationCode>${leg.destination}</IATA_LocationCode>
              </Arrival>
              <Dep>
                  <AircraftScheduledDateTime>${moment(leg.departure).format(
                    'YYYY-MM-DDTHH:mm:ss'
                  )}</AircraftScheduledDateTime>
                  <IATA_LocationCode>${leg.origin}</IATA_LocationCode>
              </Dep>
              <MarketingCarrierInfo>
                  <CarrierDesigCode>${country}</CarrierDesigCode>
                  <MarketingCarrierFlightNumberText>OPEN</MarketingCarrierFlightNumberText>
              </MarketingCarrierInfo>
              <PaxSegmentID>SEG${index + 1}</PaxSegmentID>
          </PaxSegment>
      </PaxJourney>
  </SpecificOriginDestCriteria>`;
  });
  return flightLegs;
};

const convertPassengerNumbers = (
  adults: number,
  children: number,
  infants: number
): string => {
  let string = '';
  for (let i = 0; i < adults; i++) {
    string += `<Pax><PaxID>PX${i + 1}</PaxID><PTC>ADT</PTC></Pax>`;
  }

  for (let i = 0; i < children; i++) {
    string += `<Pax><PaxID>PX${i + 1}</PaxID><PTC>CHD</PTC></Pax>`;
  }

  for (let i = 0; i < infants; i++) {
    string += `<Pax><PaxID>PX${i + 1}</PaxID><PTC>INF</PTC></Pax>`;
  }

  return string;
};

export default search;
