import axios from 'axios';
import moment from 'moment';
import { supportedCountries } from './pos';
import logger from '../../../../configs/logger';

const {
  THEJERSEYFLIGHTS_AUTHCODE,
  THEJERSEYFLIGHTS_MSOURCE,
  THEJERSEYFLIGHTS_PASSWORD,
  THEJERSEYFLIGHTS_URL
} = process.env;

const cabinClassMap: IDictionary<string> = {
  Economy: 'Y',
  Premium_Economy: 'W',
  First: 'F',
  Business: 'C'
};

const JourneyTypeMap: IDictionary<string> = {
  oneway: 'O',
  round: 'R'
};

const search = async (input: SearchTrainOptions) => {
  if (
    input.tripType === 'multi' ||
    !supportedCountries.includes(input.country)
  ) {
    return {};
  }

  const payload = {
    SessionID: 'FSPTLC56756',
    Origin: input.legs[0].origin,
    Destination: input.legs[0].destination,
    DepartDate: moment.utc(input.legs[0].departure).format('MM/DD/YYYY'),
    ReturnDate: moment.utc(input.legs[0].departure).format('MM/DD/YYYY'),
    JourneyType: JourneyTypeMap[input.tripType],
    Adult: input.adults,
    Child: input.children,
    Infant: input.infants,
    CabinClass: cabinClassMap[input.cabinClass],
    IsFlexible: false,
    Airlines: '',
    Currency: 'USD',
    Company: 'JRF',
    MSource: THEJERSEYFLIGHTS_MSOURCE
  };

  const Authentication = {
    AuthCode: THEJERSEYFLIGHTS_AUTHCODE
  };

  const Authorization =
    'Basic ' +
    Buffer.from(
      THEJERSEYFLIGHTS_MSOURCE + ':' + THEJERSEYFLIGHTS_PASSWORD
    ).toString('base64');

  const results = await axios
    .post(
      THEJERSEYFLIGHTS_URL,
      JSON.stringify({ ReqSearchFares: { search: payload, Authentication } }),
      {
        headers: {
          'content-type': 'application/json',
          Accept: 'text/json',
          Authorization
        }
      }
    )
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err);
      return {};
    });

  return results;
};

export default search;
