import { Document } from 'mongoose';

export interface IMap extends Document {
  originName: string;
  originCode: string;
  destinationName: string;
  destinationCode: string;
  originCityName: string;
  originCityCode: string;
  destinationCityName: string;
  destinationCityCode: string;
  originLocation: {
    type: string;
    coordinates: number[];
  };
  destinationLocation: {
    type: string;
    coordinates: number[];
  };
  departure: string;
  return: string;
  tripType: string;
  tripClass: string;
  adults: number;
  children: number;
  infants: number;
  filters: {
    prices: {
      min: number;
      max: number;
    };
    stops: {
      direct: number;
      oneStop: number;
      moreThanOneStop: number;
    };
    durations: {
      min: number;
      max: number;
    };
    airlines: {
      code: string;
      amount: number;
    }[];
  };
}
