import axios from 'axios';
import moment from 'moment';
import xml2js from 'xml2js';
import uuid from 'uuid';
import logger from '../../../../configs/logger';

const parser = new xml2js.Parser();

const { REQ_URL_TRAVELOUTS } = process.env;

const cabinClassMap: IDictionary<string> = {
  Economy: 'Y',
  Business: 'C',
  Premium_Economy: 'W',
  First: 'F'
};
const tripTypeMap: IDictionary<boolean> = {
  oneway: false,
  round: true
};
const transformOptions = (options: SearchOptions) => {
  const { legs, country, language, adults, children, infants, cabinClass } =
    options;

  return {
    legs: legs,
    curr: 'USD',
    country: country,
    language: language,
    tripType: tripTypeMap[options.tripType],
    adult: adults,
    child: children,
    infant: infants,
    cabin: cabinClassMap[cabinClass]
  };
};
const formLegs = (legs: SearchOptionLeg[]) => {
  const legsData = [];
  for (const leg of legs) {
    const Data = {
      ArrivalApt: leg.destination,
      DepartApt: leg.origin,
      DepartDate: moment(leg.departure).format('YYYY-MM-DD')
    };
    legsData.push(Data);
  }
  return legsData;
};

const search = async (input: SearchOptions) => {
  if (input.tripType === 'multi') return {};
  const options = transformOptions(input);
  const formedLeg = formLegs(options.legs);
  const source = 'travolic';
  const isDirrect = false;
  const airlines = 'ALL';
  const isFlxDate = false;
  const { destination, origin } = options.legs[0];
  const departureDate = moment
    .utc(formedLeg[0].DepartDate, 'YYYY-MM-DD')
    .format('DD-MM-YYYY');
  const sessionID: string = uuid.v4();
  let URL = `${REQ_URL_TRAVELOUTS}?DepartureDate=${departureDate}&Source=${source}&Origin=${origin}&FNonStop=${isDirrect}&PreAirline=${airlines}&isReturn=${options.tripType}&isFlxDate=${isFlxDate}&_class=${options.cabin}&sessionID=${sessionID}&Infants=${options.infant}&Childs=${options.child}&Adults=${options.adult}&Destination=${destination}`;
  if (options.tripType) {
    const arrivalDate = moment
      .utc(formedLeg[1].DepartDate, 'YYYY-MM-DD')
      .format('DD-MM-YYYY');
    URL = URL.concat(`&ArrivalDate=${arrivalDate}`);
  } else {
    URL = URL.concat(`&ArrivalDate=${departureDate}`);
  }
  const response = await axios
    .get(URL)
    .then(async (res) => {
      let { data } = res;
      data = data.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      return parser.parseStringPromise(data);
    })
    .catch((err) => logger.error(err));

  return response;
};

export default search;
