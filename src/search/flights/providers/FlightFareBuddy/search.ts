import axios from 'axios';
import moment from 'moment';
import { supportedCountriesCompaniesCurrencies } from './pos';
import logger from '../../../../configs/logger';
const {
  FLIGHTFAREBUDDY_URL,
  FLIGHTFAREBUDDY_AUTH_CODE,
  FLIGHTFAREBUDDY_PASSWORD,
  FLIGHTFAREBUDDY_SESSION_ID
} = process.env;

const cabinClassMap = {
  Economy: 'Y'
};

const TripTypeMap = {
  round: 'R',
  oneway: 'O'
};

const transformOptions = (options: SearchOptions) => {
  const { cabinClass, tripType } = options;
  return {
    cabin: cabinClassMap[cabinClass],
    tripType: TripTypeMap[tripType]
  };
};

const search = async (input: SearchOptions) => {
  const objCountries = supportedCountriesCompaniesCurrencies;
  if (
    input.tripType === 'multi' ||
    input.cabinClass === 'Premium_Economy' ||
    !Object.keys(objCountries).includes(input.country) ||
    objCountries[input.country].Currency !== input.currency
  ) {
    return {};
  }

  const options = transformOptions(input),
    company = objCountries[input.country].Company,
    MSource = 'TVC';

  const payload = {
    ReqSearchFares: {
      Search: {
        SessionID: FLIGHTFAREBUDDY_SESSION_ID,
        Origin: input.legs[0].origin,
        Destination: input.legs[0].destination,
        DepartDate: moment
          .utc(input.legs[0].departure, 'YYYY-MM-DD')
          .format('MM/DD/YYYY'),
        Adult: input.adults,
        Child: input.children,
        Infant: input.infants,
        CabinClass: options.cabin,
        Direct: 'false',
        JourneyType: options.tripType,
        IsFlexible: 'false',
        Airlines: '',
        Currency: input.currency,
        Company: company,
        MSource: MSource
      },
      Authentication: {
        AuthCode: FLIGHTFAREBUDDY_AUTH_CODE
      }
    }
  };

  if (input.tripType === 'round') {
    payload.ReqSearchFares.Search['ReturnDate'] = moment
      .utc(input.legs[1].departure, 'YYYY-MM-DD')
      .format('MM/DD/YYYY');
  }

  const credentials = Buffer.from(
    `${MSource}:${FLIGHTFAREBUDDY_PASSWORD}`,
    'utf-8'
  ).toString('base64');

  const data = await axios
    .post(FLIGHTFAREBUDDY_URL, payload, {
      headers: {
        Authorization: `Basic ${credentials}`
      }
    })
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err.message);
      return {};
    });
  return data;
};
export default search;
