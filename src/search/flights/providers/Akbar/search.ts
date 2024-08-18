import axios from 'axios';
import moment from 'moment';
import logger from '../../../../configs/logger';
import POS from './pos';

const cabinClassMap: IDictionary<string> = {
  Economy: 'E',
  Premium_Economy: 'PE',
  First: 'F',
  Business: 'B'
};
const tripTypeMap: IDictionary<string> = {
  oneway: 'ON',
  round: 'RT'
};

const transformOpions = (options: SearchOptions) => {
  const { legs, tripType, currency, adults, children, infants, cabinClass } =
    options;
  return {
    From: legs[0].origin,
    To: legs[0].destination,
    OnwardDate: moment.utc(legs[0].departure).format('YYYY-MM-DD'),
    ReturnDate: legs[1]
      ? moment.utc(legs[1].departure).format('YYYY-MM-DD')
      : undefined,
    currency,
    adults,
    children,
    infants,
    tripType: tripTypeMap[tripType],
    cabinClass: cabinClassMap[cabinClass]
  };
};

const search = async (input: SearchOptions) => {
  const options = transformOpions(input);

  const posData = POS.find((item) => item.currency === options.currency);
  if (!posData) return {};

  const signaturePayload = {
    MerchantID: posData.merchantID,
    ApiKey: posData.apiKey
  };

  const TOKEN = await axios
    .post(posData.signatureURL, JSON.stringify(signaturePayload), {
      headers: {
        'content-type': 'application/json',
        Accept: 'text/json'
      }
    })
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err);
    });
  const payload = {
    ADT: options.adults,
    CHD: options.children,
    INF: options.infants,
    Cabin: options.cabinClass,
    Source: posData.source,
    Mode: posData.mode,
    ClientID: '',
    TUI: '',
    FareType: options.tripType,
    Trips: [
      {
        From: options.From,
        To: options.To,
        ReturnDate: options.ReturnDate,
        OnwardDate: options.OnwardDate,
        TUI: ''
      }
    ],
    Parameters: {
      Airlines: '',
      GroupType: '',
      Refundable: '',
      IsDirect: false,
      IsExtent: true
    }
  };

  const TUI = await axios
    .post(posData.metaURL, JSON.stringify(payload), {
      headers: {
        'content-type': 'application/json',
        Accept: 'text/json',
        Authorization: `Bearer ${TOKEN['Token']}`
      }
    })
    .then((res) => res.data);

  const TUIpayload = {
    ClientID: '',
    TUI: TUI.TUI
  };

  const results = [];
  let complete = false;

  while (!complete) {
    const result = await axios
      .post(posData.extentURL, JSON.stringify(TUIpayload), {
        headers: {
          'content-type': 'application/json',
          Accept: 'text/json',
          Authorization: `Bearer ${TOKEN['Token']}`
        }
      })
      .then((res) => res.data);

    results.push(result);

    if (result.Completed !== 'False') {
      complete = true;
    }
  }

  return results;
};

export default search;
