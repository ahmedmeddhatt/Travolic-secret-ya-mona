import axios from 'axios';
import moment from 'moment';
import { supportedCountries } from './pos';
import logger from '../../../../configs/logger';

const {
  FLYERCHEAPER_AUTHCODE,
  FLYERCHEAPER_MSOURCE,
  FLYERCHEAPER_PASSWORD,
  FLYERCHEAPER_URL
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
    SessionID: 'FRCTLC098769',
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
    Company: 'FRC',
    MSource: FLYERCHEAPER_MSOURCE
  };

  const Authentication = {
    AuthCode: FLYERCHEAPER_AUTHCODE
  };

  const Authorization =
    'Basic ' +
    Buffer.from(FLYERCHEAPER_MSOURCE + ':' + FLYERCHEAPER_PASSWORD).toString(
      'base64'
    );

  const results = await axios
    .post(
      FLYERCHEAPER_URL,
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
