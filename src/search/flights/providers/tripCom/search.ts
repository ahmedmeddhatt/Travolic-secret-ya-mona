import axios from 'axios';
import logger from '../../../../configs/logger';

const {
  TRIPCOM_API_KEY,
  TRIPCOM_UUID,
  TRIPCOM_ICODE,
  TRIPCOM_SID,
  TRIPCOM_AID
} = process.env;

const tripTypesMap: IDictionary<string> = {
  oneway: 'OW',
  round: 'RT',
  multi: 'MT'
};

const ConvertLegs = (legs: SearchOptionLeg[]) => {
  const flightLegs = [];

  for (const leg of legs) {
    const arr = {};

    arr['DCityCode'] = leg.origin;
    arr['ACityCode'] = leg.destination;
    arr['DDate'] = leg.departure;

    flightLegs.push(arr);
  }
  return flightLegs;
};

const ConvertAirport = (options: SearchOptions) => {
  const flightLegs = {};

  if (!options.legs[0].orig_city) {
    flightLegs['DPort'] = options.legs[0].origin;
  }

  if (!options.legs[0].dest_city) {
    flightLegs['APort'] = options.legs[0].destination;
  }

  if (Object.keys(flightLegs).length === 0) return undefined;

  return flightLegs;
};

const transformOptions = (options: SearchOptions) => {
  const {
    legs,
    tripType,
    currency,
    adults,
    children,
    infants,
    cabinClass,
    country
  } = options;

  return {
    legs,
    tripType: tripTypesMap[tripType],
    cabinClass,
    currency,
    adults,
    children,
    infants,
    country
  };
};

const search = async (input: SearchOptions) => {
  const options = transformOptions(input);

  const supportedCurrencies = [
    'USD ',
    'SGD',
    'AED',
    'AUD',
    'BRL',
    'CAD',
    'CHF',
    'CNY',
    'DKK',
    'EUR',
    'GBP',
    'HKD',
    'IDR',
    'INR',
    'JPY',
    'KRW',
    'MOP',
    'MXN',
    'MYR',
    'NZD',
    'PHP',
    'PLN',
    'RUB',
    'SAR',
    'SEK',
    'SGD',
    'THB',
    'TRY',
    'TWD',
    'VND'
  ];

  if (!supportedCurrencies.includes(options.currency)) {
    options.currency = 'USD';
  }

  const payload = {
    Head: {
      APIKey: TRIPCOM_API_KEY,
      Currency: options.currency,
      Language: 'English',
      Country: options.country,
      AllianceInfo: {
        AllianceID: TRIPCOM_AID,
        SID: TRIPCOM_SID,
        Uuid: 'test',
        UseDistributionChannels: true
      }
    },
    IsShowAll: 1,
    IsCombination: 1,
    SearchType: 'Sync',
    TripType: options.tripType,
    ClassType: options.cabinClass,
    IsLowPrice: 1,
    MaxDepartCount: 500,
    TravelerNumber: {
      Adult: options.adults,
      Child: options.children,
      Infant: options.infants,
      TravelerEligibilityCodeType: 'ALL'
    },
    SequenceInfo: {
      SequenceType: 'Price',
      CollationsType: 'Asc'
    },
    ICODE: TRIPCOM_ICODE,
    UUID: TRIPCOM_UUID,
    SID: TRIPCOM_SID,
    AID: TRIPCOM_AID,
    Formart: 'json',
    SegmentParameterList: ConvertLegs(options.legs),
    FilterInfo: ConvertAirport(input),
    Token: undefined
  };

  const authURL = `https://openserviceauth.ctrip.com/OpenServiceAuth/authorize.ashx?AID=${TRIPCOM_AID}&SID=${TRIPCOM_SID}&KEY=${TRIPCOM_API_KEY}`;

  const { data } = await axios.get(authURL, {
    headers: {
      'content-type': 'application/json'
    }
  });

  payload.Token = data.Access_Token;

  const result = await axios
    .post(
      'https://sopenservice.ctrip.com/OpenService/ServiceProxy.ashx',
      JSON.stringify(payload),
      {
        headers: {
          'content-type': 'application/json'
        }
      }
    )
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err);
      return {};
    });

  return result;
};

export default search;
