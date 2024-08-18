import axios from 'axios';
import moment from 'moment';
import logger from '../../../../configs/logger';

const { FAREPORTAL_API_URL, FAREPORTAL_USERNAME, FAREPORTAL_PASSWORD } =
  process.env;

const tripTypesMap: IDictionary<string> = {
  oneway: 'ONEWAYTRIP',
  round: 'RoundTrip',
  multi: 'MULTICITY'
};

const transformOpions = (options: SearchOptions) => {
  const { legs, tripType, currency, adults, children, infants, cabinClass } =
    options;
  return {
    tripType: tripTypesMap[tripType],
    departureDate: moment.utc(legs[0].departure).format('YYYYMMDD'),
    returnDate: legs[1]
      ? moment.utc(legs[1].departure).format('YYYYMMDD')
      : undefined,
    currency,
    adults,
    children,
    infants,
    cabinClass,
    legs
  };
};

const search = async (input: SearchOptions) => {
  const options = transformOpions(input);

  const payload = {
    ResponseVersion: 'VERSION41',
    FlightSearchRequest: {
      Adults: options.adults,
      Child: options.children,
      Seniors: 0,
      InfantOnSeat: options.infants,
      InfantInLap: 0,
      Youths: 0,
      TypeOfTrip: options.tripType,
      ClassOfService: options.cabinClass,
      ResponseVersion: 'VERSION41',
      SegmentDetails: ConvertLegs(options.legs)
    }
  };

  const results = await axios
    .post(FAREPORTAL_API_URL, JSON.stringify(payload), {
      headers: {
        'content-type': 'application/json',
        Accept: 'text/json',
        Authorization:
          'Basic ' +
          Buffer.from(FAREPORTAL_USERNAME + ':' + FAREPORTAL_PASSWORD).toString(
            'base64'
          )
      }
    })
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err);
      return {};
    });

  return results;
};

const ConvertLegs = (legs) => {
  const flightLegs = [];
  legs.forEach((leg) => {
    const arr = {};
    arr['Origin'] = leg.origin;
    arr['Destination'] = leg.destination;
    arr['DepartureDate'] = moment.utc(leg.departure).format('YYYY-MM-DD');
    arr['DepartureTime'] = '0000';
    flightLegs.push(arr);
  });
  return flightLegs;
};
export default search;
