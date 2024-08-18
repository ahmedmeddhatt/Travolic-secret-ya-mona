import { Model } from 'mongoose';
import { Document } from 'mongoose';
import { ITranslation } from './translation.interface';

export interface ITopDestinationDocument extends Document {
  type: string;
  rank: number;
  originName: string;
  originCode: string;
  originCityCode: string;
  destinationCityCode: string;
  destinationName: string;
  destinationCode: string;
  phrase: string;
  oneWayPrice: {
    minPrice: {
      amount: number;
    };
  };
  roundPrice: {
    minPrice: {
      amount: number;
    };
  };
  currency: string;

  translation: [ITranslation];
}

export interface ITopDestinationModel extends Model<ITopDestinationDocument> {
  trendingPipeline(
    limit: number,
    page: number,
    origin: string,
    searchWord: string
  ): ITopDestinationDocument[];
  trendingAirportsPipeline(
    origin: string,
    type: string,
    page: number,
    limit: number
  ): ITopDestinationDocument[];
}
