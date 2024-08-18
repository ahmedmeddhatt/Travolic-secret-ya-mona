export type Segment = {
  origin: string;
  // Three-letter IATA airport code from which the flight will depart.

  destination: string;
  // Three-letter IATA airport code to which the flight is going.

  distance?: number;

  // The number of miles for this flight segment. Otherwise, distance is calculated using the great-circle distance between the origin and destination and may not match other data sources exactly.

  departure?: string;
  // The date on the flight will depart from the origin to go to the destination. This is used to determine which earnings chart will be in effect at time of departure.

  carrier: string;
  // Two-letter IATA carrier code for the marketing airline. This is used to determine which earnings chart will be applied for this segment. NOTE: Frequent flyer programs based on operating carrier, including but not limited to Star Alliance carriers, cannot be reliably mapped to a booking class and will not be accurately reflected in this API.

  operatingCarrier?: string;
  // Two-letter IATA carrier code for the operating airline. This value is only used when earning is based on marketing carrier but restricted to a specific operating carrier. Leaving this value blank will assume the flight is operated by the marketing carrier.

  bookingClass: string;
  // Single-letter booking class used to determine the earning rate for the flight segment.

  flightNumber?: number;
  // The airline identifier for the flight segment, most commonly (but not always) a number and is used for earning charts that are restricted to specific flight numbers.
};
export type Itinerary = {
  id?: string;
  // Unique identifier for this itinerary that will be passed back to help correlate a result.

  ticketingCarrier?: string;
  // Two-letter IATA carrier code for the ticketing or plating airline. This is used for revenue programs (i.e. UA, DL, B6). Leaving this value blank will exclude revenue programs.

  baseFare: number;
  // Amount that will be used to calculate revenue program mileage earning. This amount should generally include carrier imposed surcharges but exclude other taxes. Default is 0.

  currency: string;
  // Three-letter ISO currency code used to calculate revenue program mileage earning. Default is USD.

  segments?: Segment[];
};

export type CalculateItineraryResult = {
  id?: string;

  // Unique identifier provided for this itinerary.

  totals?: CalculateItineraryProgramResult[];
  // Total miles earned for each frequent flyer program.
};
export type CalculateItineraryProgramResult = {
  id?: string;

  // Unique identifier for the frequent flyer program. See Programs API.

  name?: string;
  // Frequent flyer program name. See Programs API.

  unpublished: boolean;
  // Indicates that the itinerary may be missing miles due to unpublished earning rates from the program.

  revenueBased: boolean;
  // Indicates that the itinerary includes revenue-based miles earnings.
  value: number; //int
  // Total redeemable miles or points earned for the frequent flyer program.
  airlines?: string[];
  // Two-letter IATA carrier codes that are associated with the frequent flyer program.
};

export type Program = {
  id?: string;
  // Unique identifier for the frequent flyer program.
  programName?: string;
  // Name of the frequent flyer program.

  fullName: string;
  // Full name of the frequent flyer program including the airline, if applicable.

  denomination: string;
  // Name of the unit of a mile or point.

  tierNames?: string[];
  //Name of each tier level for the frequent flyer program.
  airlines?: [];
};
