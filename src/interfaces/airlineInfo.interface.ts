export interface AirlineInfo {
  airlineCode: string;
  airlineAmount: number;
  flightCurrency: string;
  flightItemId: string;
}

export interface AirlinesObject {
  [key: string]: AirlineInfo[];
}

export default AirlineInfo;
