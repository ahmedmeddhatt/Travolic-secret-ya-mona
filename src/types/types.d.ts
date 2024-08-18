type CronSettings = {
  pattern: string;
  timezone: string;
  job: () => void;
};

type element = {
  title: string;
  image_url: string;
  subtitle: string;
  default_action: {
    type: string;
    url: string;
  };
  buttons: [
    {
      type: string;
      url: string;
      title: string;
    }
  ];
};
type gallery = {
  attachment: {
    type: string;
    payload: {
      template_type: string;
      image_aspect_ratio: string;
      elements: element[];
    };
  };
};

type searchFlightPriceFilters = {
  direct: number;
  oneStop: number;
  moreThanOneStop: number;
  airlines: Array<{
    code: string;
    amount: number;
  }>;
  providers: Array<{
    name: string;
    amount: number;
  }>;
};

type searchHotelPriceFilters = {
  hotels: Array<{
    name: string;
    amount: number;
  }>;
  providers: Array<{
    name: string;
    amount: number;
  }>;
};

type PriceCalendar = {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  currency: string;
};

type SendEmailDto = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  dynamicTemplateData?: any;
};

type SearchInput = {
  query: string;
  collections?: string[];
  featured?: boolean;
  orientation?: 'landscape' | 'portrait';
  count?;
};

type PingImageResponse = {
  _type: string;
  instrumentation: {
    _type: string;
  };
  readLink: string;
  webSearchUrl: string;
  queryContext: {
    originalQuery: string;
    alterationDisplayQuery: string;
    alterationOverrideQuery: string;
    alterationMethod: string;
    alterationType: string;
  };
  totalEstimatedMatches: number;
  nextOffset: number;
  currentOffset: number;
  value: [
    {
      webSearchUrl: string;
      name: string;
      thumbnailUrl: string;
      datePublished: string;
      isFamilyFriendly: true;
      contentUrl: string;
      hostPageUrl: string;
      contentSize: string;
      encodingFormat: string;
      hostPageDisplayUrl: string;
      width: number;
      height: number;
      hostPageDiscoveredDate: number;
      thumbnail: {
        width: number;
        height: number;
      };
      imageInsightsToken: number;
      insightsMetadata: {
        pagesIncludingCount: number;
        availableSizesCount: number;
      };
      imageId: string;
      accentColor: string;
    }
  ];
};

type PredictOptions = {
  airline: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  currentPrice?: string;
  currency?: string;
};

interface IDictionary<TValue> {
  [id: string]: TValue;
}

type CacheOptions = {
  prefix?: string;
  until?: string;
  duration?: moment.Duration;
  args?: boolean;
};

type Geolocation_Cache_Data = {
  ip_address: string;
  country_code: string;
  country: string;
  region: string;
  city: string;
  latitude: string;
  longitude: string;
};

type SearchOptionLeg = {
  origin: string;
  originPlaceType: string;
  origin_city: string;
  destination: string;
  destinationPlaceType: string;
  destination_city: string;
  departure: string;
  orig_city: boolean;
  dest_city: boolean;
  fromLat?: number;
  fromLon?: number;
  toLat?: number;
  toLon?: number;
  addAlternativeOrigins?: boolean;
  addAlternativeDestinations?: boolean;
};
type SearchOptionLeg2 = {
  origin: string[];
  originPlaceType: string;
  origin_city: string;
  destination: string[];
  destinationPlaceType: string;
  destination_city: string;
  departure: string;
  orig_city?: boolean;
  dest_city?: boolean;
  fromLat?: number;
  fromLon?: number;
  toLat?: number;
  toLon?: number;
  addAlternativeOrigins?: boolean;
  addAlternativeDestinations?: boolean;
};
type SearchOptions2 = {
  orig_city?: any;
  tripType: 'multi' | 'round' | 'oneway';
  currency: string;
  country: string;
  language: string;
  legs: SearchOptionLeg2[];
  adults: number;
  children: number;
  origin: any;
  destination: any;
  infants: number;
  cabinClass: string;
  visitorId?: string;
  userData: {
    ip: string;
    country_code: string;
    location: number[];
    _id?: string;
  };
  nomadLocation: [{ locations: [string]; nights_range: [number] }];
  type: string;
  logId?: any;
  nearbyAirportOne?: boolean;
  nearbyAirportTwo?: boolean;
};

type SearchOptions = {
  orig_city: any;
  tripType: 'multi' | 'round' | 'oneway';
  currency: string;
  country: string;
  language: string;
  legs: SearchOptionLeg[];
  adults: number;
  children: number;
  origin: any;
  destination: any;
  infants: number;
  cabinClass: string;
  visitorId?: string;
  userData: {
    ip: string;
    country_code: string;
    location: number[];
    _id?: string;
  };
  nomadLocation: [{ locations: [string]; nights_range: [number] }];
  type: string;
  logId?: any;
  nearbyAirportOne?: boolean;
  nearbyAirportTwo?: boolean;
  searchId?: string;
};

type SearchTrainOptions = {
  tripType: 'multi' | 'round' | 'oneway';
  currency: string;
  country: string;
  language: string;
  origin?: any;
  destination?: any;
  legs: SearchOptionLeg[];
  adults: number;
  children: number;
  infants: number;
  cabinClass: string;
  visitorId?: string;
  userData: {
    ip: string;
    country_code: string;
    location: number[];
    _id?: string;
  };
  type: string;
  logId?: any;
  fromLng?: number;
  fromLat?: number;
  toLng?: number;
  toLat?: number;
};

type SearchTransfersOptions = {
  tripType: 'round' | 'oneway';
  currency: string;
  language: string;
  legs: SearchOptionLegTransfers[];
  adults: number;
  children: number;
  infants: number;
  visitorId?: string;
  userData: {
    ip: string;
    country_code: string;
    location: number[];
    _id?: string;
  };
};

type ExternalSearchInfo = {
  source?: string;
  deviceInfo: string;
  devicePlatform: string;
  devicePlatformName: string;
  deviceVersion: string;
  deviceType: string;
};

type SearchHotelOptions = {
  checkIn: string;
  checkOut: string;
  currency: string;
  adults: number;
  children: number;
  infants?: number;
  language?: string;
  rooms?: number;
  countryCode?: string;
  country?: string;
  city?: string;
  cityCode?: string;
  cityId?: string;
  hotelId?: string;
  isCity?: boolean;
  hotelName?: string;
  visitorId?: string;
  userData: {
    ip: string;
    country_code: string;
    location: number[];
    _id?: string;
  };
  idList: string[];
  hotelsData?: any[];
  type: 'hotels' | 'cities' | 'country';
};

type FlightsTrackingSearchOptions = SearchOptions & ExternalSearchInfo;

type HotelsTrackingSearchOptions = SearchHotelOptions & ExternalSearchInfo;

type TrainsTrackingSearchOptions = SearchTrainOptions & ExternalSearchInfo;

type TransfersTrackingSearchOptions = SearchTransfersOptions &
  ExternalSearchInfo;

type RedirectOptions = {
  itineraryId?: string;
  itineraryIds?: string[];
  searchId: string;
  visitorId: string;
  price: number;
  currency: string;
  country: string;
  adults: number;
  children: number;
  infants: number;
  type: string;
  token?: string;
  tokens?: string[];
  legs?: {
    origin_name: string;
    destination_name: string;
    originPlaceType: string;
    destinationPlaceType: string;
    des_from: string;
    des_to: string;
    start_long: string;
    start_lat: string;
    end_long: string;
    end_lat: string;
    origin: string;
    destination: string;
    departure: string;
    arrival: string;
    time: string;
    from_type: string;
    to_type: string;
  }[];
  segments?: TransformedSegment[];
  language: string;
  utm_source?: string;
};

type HotelRedirectOptions = {
  hotelId?: string;
  hotelsIds?: string[];
  searchId: string;
  visitorId: string;
  price: number;
  currency: string;
  country: string;
  adults: number;
  children: number;
  rooms: string;
  checkIn: string;
  checkOut: string;
  type: string;
  token?: string;
  tokens?: string[];
  language: string;
  utm_source?: string;
};

type TransformedSegmentWithoutID = {
  origin: string;
  departure: string;
  destination: string;
  originName?: string;
  destinationName?: string;
  arrival: string;
  marketingCarrier: string;
  operatingCarrier?: string;
  marketingFlightNumber?: string;
  aircraft?: string;
  trainNumber?: string;
  duration?: number;
  vehicleType?: string;
  fromLng?: number;
  fromLat?: number;
  toLng?: number;
  toLat?: number;
  fromTimezone?: string;
  toTimezone?: string;
};

type TransformedSegment = TransformedSegmentWithoutID & {
  id: string;
};

type TransformedLegWithoutID = {
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  segments: string[];
  stopCount: number;
  marketingCarriers: string[];
  duration?: number;
  vehicleType?: string[];
};

type TransformedHotelDetails = {
  hotelId: string;
  checkIn: string;
  checkOut: string;
  roomType?: string;
  houseType?: string;
  roomId?: string;
  hostelName?: string;
  hostelAddress?: string;
  stars?: number;
  reviewsCount?: string;
  amenities?: Record<string, any>;
  restrictions?: Record<string, any>;
  facilities?: Record<string, any>;
  rating?: number;
  avgNightLyPrice?: number;
  pricingOptions?: PricingOption[];
  images?: string;
};

type TransformedLeg = TransformedLegWithoutID & {
  id: string;
};

type PricingOption = {
  agent: string;
  agentName: string;
  price: {
    from?: number;
    amount: number;
    person?: number;
    currency: string;
    discount?: number;
    type?: string;
  };

  meta?: {
    baggage?: BaggageAllowance;
    restrictions?: {
      refundable?: boolean;
      changePenalties?: boolean;
      changable?: boolean;
    };
    segments?: IDictionary<{
      bookingCode: string;
    }>;
  };
  deepLink: string;
};

type TransformedItineraryWithoutID = {
  legs: string[];
  pricingOptions: PricingOption[];
  count?: number;
  isFavorite: boolean;
};

type TransformedItinerary = {
  id: string;
  legs: string[];
  origin?: string;
  destination?: string;
  pricingOptions: PricingOption[];
  linkedItineraries?: string[];
  isFavorite: boolean;
};

type CodeShare = {
  marketingCarrier: string;
  operatingCarrier?: string;
  aircraftType?: string;
};

type BaggageAllowance = {
  totalPieces?: number | undefined;
  totalKilos?: number | undefined;
  totalBaggages?: number | undefined;
  BaggagesInKilos?: number | undefined;
  totalHandbages?: number | undefined;
  HandbagesInKilos?: number | undefined;
  totalPrice?: number | undefined;
  totalBaggagePrice?: number | undefined;
  totalHandbagPrice?: number | undefined;
};

type TransformedResult = {
  agents: IDictionary<any>;
  legs: IDictionary<TransformedLeg>;
  segments: IDictionary<TransformedSegment>;
  itineraries?: IDictionary<TransformedItinerary>;
  outboundItineraries?: IDictionary<TransformedItinerary>;
  inboundItineraries?: IDictionary<TransformedItinerary>;
  completed?: boolean;
  provider?: string;
  flightDetails?: any;
  codeShare?: IDictionary<CodeShare>;
  airlines?: any;
  airports?: any;
  stations?: any;
  dumpStations?: any;
  carriers?: any;
  dumpCarriers?: any;
  aircrafts?: any;
  error?: string;
  filterAirports?: any;
};

type TransformedTrainResult = {
  agents: IDictionary<any>;
  legs: IDictionary<TransformedLeg>;
  segments: IDictionary<TransformedSegment>;
  outboundItineraries?: IDictionary<TransformedItinerary>;
  inboundItineraries?: IDictionary<TransformedItinerary>;
  itineraries?: IDictionary<TransformedItinerary>;
  amenities?: any;
  trainDetails?: any;
  carriers?: any;
  stations?: any;
  dumpStations?: any;
};
type TransformedHotelResult = {
  agents: IDictionary<any>;
  data: IDictionary<TransformedHotelDetails>;
  completed?: boolean;
  provider?: string;
  error?: string;
  hotels?: any;
  chains?: any;
  brands?: any;
  hotelDetails?: any;
};

type TransformedResultMeta = {
  completed: boolean;
  provider: string;
  error?: boolean;
};

type TransformedResultValue = TransformedResult | TransformedResultMeta;

type CollectedResults = {
  timestamp: string;
  requestId: string;
  options: SearchOptions;
  providers: string[];
  airlines: any;
  airports: any;
  agents: any;
  itineraries: IDictionary<TransformedItinerary>;
  legs: IDictionary<TransformedLeg>;
  segments: IDictionary<TransformedSegment>;
  completed: boolean;
  flightDetails?: any;
  codeShare?: any;
  lastUpdateted: number;
  errors: { [key: string]: any };
};
type ProviderCollectedResults = {
  agents: any;
  itineraries: IDictionary<TransformedItinerary>;
  segments: IDictionary<TransformedSegment>;
  legs: IDictionary<TransformedLeg>;
  airlines: any;
  airports: any;
};
type CollectedTrainResults = {
  timestamp: string;
  requestId: string;
  options: SearchTrainOptions;
  providers: string[];
  carriers: any;
  stations: any;
  agents: any;
  itineraries: IDictionary<TransformedItinerary>;
  legs: IDictionary<TransformedLeg>;
  segments: IDictionary<TransformedSegment>;
  amenities?: any;
  completed: boolean;
  lastUpdateted: number;
  errors: { [key: string]: any };
};
type CollectedHotelResults = {
  timestamp: string;
  requestId: string;
  options: SearchHotelOptions;
  providers: string[];
  agents: any;
  data: IDictionary<TransformedHotelResult>;
  chains: any;
  hotels: any;
  brands: any;
  completed: boolean;
  lastUpdateted: number;
  errors: { [key: string]: any };
};
type Providers = IDictionary<{
  search: SearchFunction;
  transformResults: TransformFunction;
  interceptor?: any;
  getRedirect?: GetRedirectFunction;
}>;
type ProvidersNomad = IDictionary<{
  search: SearchFunction;
  transformResults: TransformFunction;
  interceptor?: any;
  getRedirect?: GetRedirectFunction;
}>;
type ProvidersHotel = IDictionary<{
  search: SearchHotelFunction;
  transformResults: TransformHotelFunction;
  interceptor?: any;
  getRedirect?: GetRedirectFunction;
}>;
type ProvidersCar = IDictionary<{
  search: SearchFunction;
  transformResults: TransformFunction;
  getRedirect?: GetRedirectFunction;
}>;
type providersTrain = IDictionary<{
  search: SearchTrainFunction;
  transformResults: TransformTrainFunction;
  interceptor?: any;
  getRedirect?: GetRedirectFunction;
}>;

type RedirectPayload = {
  provider: string;
  agentId: string;
  agentName: string;
  termUrl?: string;
  searchId?: string;
  currency?: string;
  flightSearchKey?: string;
  flightKey?: string;
  url?: string;
  searchID?: string;
  vehicle_id?: string;
  outboundPayload?: string;
  inboundPayload?: string;
  flightData?: any;
};

type HotelRedirectPayload = {
  provider: string;
  agentId: string;
  agentName: string;
  termUrl?: string;
  searchId?: string;
  currency?: string;
  hotelSearchKey?: string;
  hotelKey?: string;
  url?: string;
  searchID?: string;
  room_id?: string;
  checkInPayload?: string;
  checkOutPayload?: string;
  hotelData?: any;
};

type RedirectsTrackData = {
  visitor: {
    ip: string;
    city: string;
    countryCode: string;
    countryName: string;
    location: number[];
    timestamp: string;
  };
  device?: {
    os: string;
    type: string;
    platform: string;
    platformName: string;
    version: string;
  };
  searchId: string;
  provider: string;
  agentName: string;
  agentId: string;
  price: number;
  currency: string;
  legs: any[];
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
  timestamp: string;
  segments?: TransformedSegment[];
  departureDays: number;
  utm_source?: string;
};

type HotelRedirectsTrackData = {
  visitor: {
    ip: string;
    city: string;
    countryCode: string;
    countryName: string;
    location: number[];
    timestamp: string;
  };
  device?: {
    os: string;
    type: string;
    platform: string;
    platformName: string;
    version: string;
  };
  searchId: string;
  provider: string;
  agentName: string;
  agentId: string;
  checkIn: string;
  checkOut: string;
  isCity?: boolean;
  cityCode?: string;
  cityId?: string;
  hotelId?: string;
  hotelName?: string;
  price: number;
  currency: string;
  guests: {
    adults: number;
    children: number;
  };
  nightsCount?: number;
  roomsCount?: number;
  timestamp: string;
  utm_source?: string;
};

type Index<T> = {
  index: string;
  id: string;
  body: T;
};

type FlightBookTrackData = {
  redirectId: string;
  provider: string;
  price: string;
  currency: string;
  confirmation: string;
};

type HotelBookTrackData = {
  redirectId: string;
  provider: string;
  price: string;
  currency: string;
  confirmation: string;
};

type SearchTrackData = {
  tripType: 'multi' | 'round' | 'oneway';
  currency: string;
  legs: any[];
  adults: number;
  isDomestic?: boolean;
  children: number;
  infants: number;
  cabinClass: string;
  visitorId: string;
  timestamp: string;
  country: string;
  language: string;
  device: {
    os: string;
    type: string;
    platform: string;
    platformName: string;
    version: string;
    source?: string;
  };
  source?: string;
  userData: {
    ip: string;
    country_code: string;
    location: number[];
    _id?: string;
  };
  user?: any;
  departureDays: number;
};

type HotelSearchTrackData = {
  currency: string;
  checkIn: string;
  checkOut: string;
  isCity?: boolean;
  cityCode?: string;
  cityId?: string;
  hotelId?: string;
  hotelName?: string;
  guests: {
    adults: number;
    children: number;
    infants?: number;
  };
  visitorId: string;
  timestamp: string;
  country?: string;
  countryCode?: string;
  language?: string;
  device: {
    os: string;
    type: string;
    platform: string;
    platformName: string;
    version: string;
    source?: string;
  };
  source?: string;
  userData: {
    ip: string;
    country_code: string;
    location: number[];
    _id?: string;
  };
  user?: any;
  nightsCount?: number;
  roomsCount?: number;
};

type GetRedirectFunction = (redirectId: string, payload: any) => any;

type SearchFunction = (options: SearchOptions) => any;
type SearchTrainFunction = (options: SearchTrainOptions) => any;
type SearchHotelFunction = (options: SearchHotelOptions) => any;

type TransformFunction = (
  options: SearchOptions,
  providerInput: any
) => TransformedResult;

type TransformTrainFunction = (
  options: SearchTrainOptions,
  providerInput: any
) => Promise<TransformedTrainResult>;

type TransformHotelFunction = (
  options: SearchHotelOptions,
  providerInput: any
) => TransformedHotelResult;

type ItinerariesMap = {
  [key: string]: TransformedItinerary;
};

type HotelMap = {
  [key: string]: TransformedHotelDetails;
};

type SearchOptionLegTransfers = {
  start_lat: string;
  start_long: string;
  end_lat: string;
  end_long: string;
  from_iata?: string;
  to_iata?: string;
  departure: string;
  time: string;

  from_type: string;
  to_type: string;
  name: string;
  description: string;
  origin: string;
  destination: string;
  des_from?: string;
  des_to?: string;
};

type TransformedTransferLegWithoutID = {
  description: string;
  viehcle_type?: string;
  model?: string;
  make?: string;
  class?: string;
  time?: number;
  max_passengers: number;
  max_bags: number;
  wait_time?: number;
  carImage_url?: string;
  departure_time?: string;
  free_cancellation?: boolean;
  review_count?: number;
  average_rating?: number | string;
  instruction_for_customer?: string;
  supporter_providerName?: string;
  type?: string;
};
type TransformedTransferLeg = TransformedTransferLegWithoutID & {
  id: string;
};
type TransformedTransferResult = {
  agents: IDictionary<any>;
  legs: IDictionary<TransformedTransferLeg>;
  itineraries: IDictionary<TransformedItinerary>;
  completed?: boolean;
  provider?: string;
  error?: any[];
  transferDetails?: any;
};
type CollectedTransferResults = {
  timestamp: string;
  requestId: string;
  options: SearchTransfersOptions;
  providers: string[];
  agents: any;
  itineraries: IDictionary<TransformedItinerary>;
  legs: IDictionary<TransformedTransferLeg>;
  completed: boolean;
  lastUpdateted: number;
  errors: { [key: string]: any };
};
type ProvidersTransfer = IDictionary<{
  search: SearchTransferFunction;
  transformResults: TransformTransferFunction;
  getRedirect?: GetRedirectFunction;
}>;
type SearchTransferFunction = (options: SearchTransfersOptions) => any;
type TransformTransferFunction = (
  options: SearchTransfersOptions,
  providerInput: any
) => TransformedTransferResult;
