import { Document, Model } from 'mongoose';
import { ITranslation } from './translation.interface';

export interface IPlace extends Document {
  code: string;
  city?: any;
  state?: any;
  cityCode: string;
  countryCode: string;
  country?: any;
  location: {
    type: string;
    coordinates: number[];
  };
  stations: number;
  airports: number;
  name: string;
  phrase: string;
  placeType: string;
  placeTypeIndex: number;
  translation: ITranslation[];
}

export interface IPlaceModel extends Model<IPlace> {
  searchFlightPlacesPipeline(
    searchWord: string,
    language: string
  ): Promise<IPlace[]>;
  searchStationPlacesPipeline(
    searchWord: string,
    language: string
  ): Promise<IPlace[]>;
  searchCityPlacesPipeline(
    searchWord: string,
    language: string
  ): Promise<IPlace[]>;
  searchHotelPlacesPipeline(
    searchWord: string,
    language: string
  ): Promise<IPlace[]>;
  searchFlightPlacesPipelineV2(
    searchWord: string,
    language: string
  ): Promise<IPlace[]>;
  searchCityPlacesPipelineV2(
    searchWord: string,
    language: string
  ): Promise<IPlace[]>;
  searchStationPlacesPipelineV2(
    searchWord: string,
    language: string
  ): Promise<IPlace[]>;
  searchHotelPlacesPipelineV2(
    searchWord: string,
    language: string
  ): Promise<IPlace[]>;
}
