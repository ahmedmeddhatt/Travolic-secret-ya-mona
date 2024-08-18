import axios from 'axios';
import moment from 'moment';
import logger from '../../../../configs/logger';

import POS from './pos';

const { TRAVEL_WINGS_API, TRAVEL_WINGS_TOKEN } = process.env;

const tripClassMap: IDictionary<string> = {
  Economy: '1',
  Premium_Economy: '2',
  Business: '3',
  First: '4'
};

const tripTypesMap: IDictionary<string> = {
  oneway: 'OneWay',
  round: 'RoundTrip',
  multi: 'MultiCity'
};

const transformOpions = (options: SearchOptions) => {
  const {
    legs,
    tripType,
    currency,
    country,
    adults,
    children,
    infants,
    cabinClass
  } = options;
  return {
    legs,
    tripType: tripTypesMap[tripType],
    cabinClass: tripClassMap[cabinClass],
    currency,
    country,
    adults,
    children,
    infants
  };
};

const search = async (input: SearchOptions) => {
  const options = transformOpions(input);
  const partnerData = POS.find(
    (p) => p.currency === options.currency && p.country === options.country
  );

  if (!partnerData) {
    return {};
  }

  const payload = {
    flightwidgetElement: [],
    tripType: options.tripType,
    noOfAdults: options.adults,
    noOfChilds: options.children,
    noOfInfants: options.infants,
    countryId: partnerData.country_code,
    prefferedAirline: null,
    allianceName: null,
    nearByAirportDestination: false,
    affilatePartnerId: partnerData.affilatePartnerId,
    affExtParam2: partnerData.affExtParam2
  };

  if (options.tripType == 'OneWay') {
    payload.flightwidgetElement.push({
      cabinClass: options.cabinClass,
      dateOfJourney: moment(options.legs[0].departure, 'YYYY-MM-DD').format(
        'DD/MM/YYYY'
      ),
      startingFrom: options.legs[0].origin,
      goingTo: options.legs[0].destination
    });
  } else if (options.tripType == 'RoundTrip') {
    payload.flightwidgetElement.push({
      cabinClass: options.cabinClass,
      dateOfJourney: moment(options.legs[0].departure, 'YYYY-MM-DD').format(
        'DD/MM/YYYY'
      ),
      startingFrom: options.legs[0].origin,
      goingTo: options.legs[0].destination,
      returnDateOfJourney: moment(
        options.legs[1].departure,
        'YYYY-MM-DD'
      ).format('DD/MM/YYYY'),
      returnCabinClass: options.cabinClass
    });
  } else {
    for (const leg of options.legs) {
      payload.flightwidgetElement.push({
        cabinClass: options.cabinClass,
        dateOfJourney: moment(leg.departure, 'YYYY-MM-DD').format('DD/MM/YYYY'),
        startingFrom: leg.origin,
        goingTo: leg.destination
      });
    }
  }

  const data = await axios
    .post(TRAVEL_WINGS_API, payload, {
      headers: {
        'AFFILATE-PARTNER-TOKEN': TRAVEL_WINGS_TOKEN,
        'Content-Type': 'application/json'
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
