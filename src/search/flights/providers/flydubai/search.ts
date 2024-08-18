import moment from 'moment';
import axios from 'axios';
import currencies from './currencies';
import logger from '../../../../configs/logger';

const {
  FLYDUBAI_CLIENT_ID,
  FLYDUBAI_CLIENT_SECRET,
  FLYDUBAI_AUTH_URL,
  FLYDUBAI_SEARCH_URL
} = process.env;

const search = async (options: SearchOptions) => {
  if (options.tripType === 'multi') return {};
  const basePayload = {
    RetrieveFareQuoteDateRange: {
      RetrieveFareQuoteDateRangeRequest: {
        SecurityGUID: '',
        CarrierCodes: {
          CarrierCode: [
            {
              AccessibleCarrierCode: 'FZ'
            }
          ]
        },
        ChannelID: 'OTA',
        CountryCode: 'AE',
        ClientIPAddress: '127.0.0.1',
        HistoricUserName: 'apitest',
        CurrencyOfFareQuote:
          currencies[options.legs[0].origin] == undefined
            ? 'AED'
            : currencies[options.legs[0].origin],
        PromotionalCode: 'FAREBRANDS',
        IataNumberOfRequestor: '',
        FullInBoundDate: moment
          .utc(options.legs[0].departure)
          .format('DD/MM/YYYY'),
        FullOutBoundDate:
          options.tripType == 'oneway'
            ? moment.utc(options.legs[0].departure).format('DD/MM/YYYY')
            : moment.utc(options.legs[1].departure).format('DD/MM/YYYY'),
        CorporationID: '-2147483648',
        FareFilterMethod: 'NoCombinabilityRoundtripLowestFarePerFareType',
        FareGroupMethod: 'WebFareTypes',
        InventoryFilterMethod: 'Available',
        FareQuoteDetails: {
          FareQuoteDetailDateRange: [
            {
              Origin: options.legs[0].origin,
              Destination: options.legs[0].destination,
              PartyConfig: '',
              UseAirportsNotMetroGroups: 'true',
              UseAirportsNotMetroGroupsAsRule: 'true',
              UseAirportsNotMetroGroupsForFrom: 'true',
              UseAirportsNotMetroGroupsForTo: 'true',
              DateOfDepartureStart: moment
                .utc(options.legs[0].departure)
                .format('YYYY-MM-DDT00:00:00'),
              DateOfDepartureEnd: moment
                .utc(options.legs[0].departure)
                .format('YYYY-MM-DDT23:59:59'),
              FareQuoteRequestInfos: {
                FareQuoteRequestInfo: [
                  {
                    PassengerTypeID: 1,
                    TotalSeatsRequired: options.adults
                  },
                  {
                    PassengerTypeID: 6,
                    TotalSeatsRequired: options.children
                  },
                  {
                    PassengerTypeID: 5,
                    TotalSeatsRequired: options.infants
                  }
                ]
              },
              FareTypeCategory: '1'
            }
          ]
        }
      }
    }
  };

  if (options.tripType == 'round') {
    basePayload.RetrieveFareQuoteDateRange.RetrieveFareQuoteDateRangeRequest.FareQuoteDetails.FareQuoteDetailDateRange.push(
      {
        Origin: options.legs[1].origin,
        Destination: options.legs[1].destination,
        PartyConfig: '',
        UseAirportsNotMetroGroups: 'true',
        UseAirportsNotMetroGroupsAsRule: 'true',
        UseAirportsNotMetroGroupsForFrom: 'true',
        UseAirportsNotMetroGroupsForTo: 'true',
        DateOfDepartureStart: moment
          .utc(options.legs[1].departure)
          .format('YYYY-MM-DDT00:00:00'),
        DateOfDepartureEnd: moment
          .utc(options.legs[1].departure)
          .format('YYYY-MM-DDT23:59:59'),
        FareQuoteRequestInfos: {
          FareQuoteRequestInfo: [
            {
              PassengerTypeID: 1,
              TotalSeatsRequired: options.adults
            },
            {
              PassengerTypeID: 6,
              TotalSeatsRequired: options.children
            },
            {
              PassengerTypeID: 5,
              TotalSeatsRequired: options.infants
            }
          ]
        },
        FareTypeCategory: '1'
      }
    );
  }

  const payload = {
    client_id: FLYDUBAI_CLIENT_ID,
    client_secret: FLYDUBAI_CLIENT_SECRET,
    grant_type: 'client_credentials',
    scope: 'res'
  };

  const auth = await axios.post(
    FLYDUBAI_AUTH_URL,
    new URLSearchParams(payload),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );

  const data = await axios
    .post(FLYDUBAI_SEARCH_URL, JSON.stringify(basePayload), {
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${auth.data.access_token}`
      }
    })
    .then((res) => res.data)
    .catch((err) => {
      logger.error(err);
      return {};
    });

  return data;
};

export default search;
