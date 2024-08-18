import axios from 'axios';
import querystring from 'querystring';
import logger from '../../../../configs/logger';
import brands from './brands';

const { AAA_PUBLISHER_ID, AAA_TOKEN, AAA_PROJECT_ID } = process.env;

const tripClassMap: IDictionary<string> = {
  Economy: 'Economy',
  Premium_Economy: 'PremiumEconomy',
  Business: 'Business',
  First: 'First'
};

const transformOptions = (options: SearchOptions) => {
  return {
    ...options,
    cabinClass: tripClassMap[options.cabinClass]
  };
};

const passengersMapping = (input: SearchOptions) => {
  const { adults, children, infants, cabinClass } = input;
  const passengers = [];
  let counter = 1;

  for (let i = 1; i <= adults; i++) {
    passengers.push({
      Id: counter++,
      TypeId: 1,
      Cabin: cabinClass
    });
  }

  for (let i = 1; i <= children; i++) {
    passengers.push({
      Id: counter++,
      TypeId: 2,
      Cabin: cabinClass
    });
  }

  for (let i = 1; i <= infants; i++) {
    passengers.push({
      Id: counter++,
      TypeId: 3,
      Cabin: cabinClass
    });
  }

  return passengers;
};

const segmentsMapping = (input: SearchOptions) => {
  const segments = [];
  let counter = 1;
  for (const leg of input.legs) {
    const segment = {
      Id: counter++,
      SegmentPassengers: {
        PassengerGroups: [
          {
            Members: passengersMapping(input)
          }
        ],
        GroupsRelation: 'All'
      },
      Origin: [leg.origin],
      Destination: [leg.destination],
      DepartureDates: [
        {
          Date: leg.departure
        }
      ]
    };
    segments.push(segment);
  }

  return segments;
};

const search = async (input: SearchOptions) => {
  const options = transformOptions(input);

  const results = [];

  for (const brand of brands) {
    const parameters = {
      publisher_id: AAA_PUBLISHER_ID,
      project_id: AAA_PROJECT_ID,
      token: AAA_TOKEN,
      Country: options.country,
      Language: options.language
    };

    const payload = {
      SearchRequest: {
        ResponseType: 'jsonv2',
        PassengerTypes: [
          {
            TypeId: 1,
            PaxType: 'Adult'
          },
          {
            TypeId: 2,
            PaxType: 'AccompaniedChild'
          },
          {
            TypeId: 3,
            PaxType: 'InfantWithoutSeat'
          }
        ],
        TripSegments: segmentsMapping(options),
        Preferences: {
          CheckAvailability: true
        }
      }
    };
    const url = `https://aaa.artefact.com/externalsources/pros/proxy/publisher/${
      brand.campaignID
    }/fetch?${querystring.stringify(parameters)}`;

    const data = await axios
      .post(url, JSON.stringify(payload), {
        headers: {
          'Content-Type': 'application/JSON',
          'Accept-Encoding': 'gzip'
        }
      })
      .then((res) => res.data)
      .catch((err) => {
        logger.error(err);
        return {};
      });

    results.push({
      ...data,
      brand
    });
  }

  return results;
};

export default search;
