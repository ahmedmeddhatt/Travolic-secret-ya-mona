import { Schema, Document } from 'mongoose';
interface IDescription {
  [key: string]: { title: string; paragraph: string };
}

interface ITranslation {
  [key: string]: IDescription;
}

interface IProviderCodes {
  [key: string]: string[];
}
export interface IHotelDocument extends Document {
  hotel_id: string;
  getaroom_id: string;
  chain_id: string;
  chain_name: string;
  brand: any;
  brand_id: string;
  brand_name: string;
  hotel_name?: string;
  cityName?: string;
  hotel_formerly_name: string;
  hotel_translated_name: string;
  addresses: string[];
  addressline1: string;
  addressline2: string;
  zipcode: string;
  state: string;
  countryisocode: string;
  star_rating: string;
  longitude: string;
  latitude: string;
  url: string;
  checkin: string;
  checkout: string;
  numberrooms: string;
  numberfloors: string;
  yearopened: string;
  yearrenovated: string;
  photos: string[];
  photo1: string;
  photo2: string;
  photo3: string;
  photo4: string;
  photo5: string;
  overview: string;
  rates_from: string;
  continent_id: string;
  continent_name: string;
  city_id: string;
  country_id: string;
  number_of_reviews: string;
  rating_average: string;
  rates_currency: string;
  rates_from_exclusive: string;
  accommodation_type: string;
  city_ref: Schema.Types.ObjectId;
  //newschema
  name: string;
  images: string[];
  description: IDescription;
  city: string;
  country: string;
  address: string;
  location: {
    type: string;
    coordinates: number[];
  };
  giataId: string;
  lastUpdate: Date;
  ratings: number;
  phone: string;
  email: string;
  urls: string[];
  providerCodes: IProviderCodes;
  chain: string;
  translation: ITranslation;
  airports: string[];
}

export interface IHotels extends Document {
  name: string;
  images: string[];
  description: IDescription;
  city: string;
  country: string;
  address: string;
  location: {
    type: string;
    coordinates: number[];
  };
  giataId: string;
  lastUpdate: string;
  ratings: number;
  phone: string;
  email: string;
  urls: string[];
  providerCodes: IProviderCodes;
  chain: string;
  translation: ITranslation;
  airports: string[];
}
