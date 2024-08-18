import amadeus from './amadeus';
import travofy from './travofy';
import Rehlat from './rehlat';
import Ryanair from './ryanair';
import edreams from './edreams';
import KIWI from './kiwi';
import kissandfly from './kissandfly';
import mytickets from './mytickets';
import transavia from './transavia';
import travelpayout from './travelpayout';
import travomint from './travomint';
import qatarairways from './qatarairways';
import Travelstart from './travel-start';
import olympicair from './olympicair';
import aegeanair from './aegeanair';
import croatiaair from './croatiaair';
import Emirates from './emirates';
// import Cheapfaremart from './cheapfaremart';
import skytours from './sky-tours';
import etravlie from './etravlie';
import skybooker from './skybooker';
import tripmonster from './tripmonster';
import Travelgenio from './travelgenio';
import travel2be from './travel2be';
import travix from './travix';
import pegasus from './pegauses';
import goAsia from './12goasia';
import lolTravel from './lolTravel';
// import Flightsmojo from './flightsmojo';
import flydubai from './flydubai';
import tripcom from './tripCom';
import flynas from './flynas';
import Akbar from './Akbar';
import sunexpress from './sunexpress';
import Travelwings from './travelwings';
import Avianca from './Avianca';
import scoot from './scoot';
import tripleA from './tripleA';
import MyHolidays from './myholidays';
import tix from './tix';
import aerocrs from './AeroCRS';
import eurowings from './EuroWings';
import Eilago from './Eilago';
import Safarni from './Safarni';
import combigo from './combigo';
import Volario from './Volario';
import condor from './condor';
import oneflightHub from './OneFlightHub';
import Milhas123 from './123Milhas';
import WorldTourStore from './WorldTourStore';
import FlyUnoMundo from './Flyunomundo';
import cheapflightsbank from './cheapflightsbank';
import flightmover from './flightmover';
import FaresoFlights from './faresOfFlights';
// import Airpaz from './Airpaz';
// import Travelouts from './Travelouts';
// import excelfares from './excelfares';
// import Destinia from './Destinia';
// import Truairfare from './truairfare';
// import easemytrip from './easemytrip';
// import CheapFlightFares from './cheapflightfares';
import Tripbookfly from './tripbookfly';
import Blueberry from './Blueberry';
import Iwofly from './iWoFly';
import Travoport from './Travoport';
import HolidayBreakz from './HolidayBreakz';
import Farehutz from './Farehutz';
import BudgetTicket from './BudgetTicket';
import FlyoDeals from './FlyoDeals';
import Wizfair from './Wizfair';
import wowTickets from './wowTickets';
import FarePorto from './FarePorto';
import Bookdreamfares from './Bookdreamfares';
import Friendztravel from './Friendztravel';
import LafeTravel from './LafeTravel';
import TravoDeals from './TravoDeals';
import thetravelmakers from './thetravelmakers';
import Travelo1 from './Travelo1';
import FareCorner from './FareCorner';
import fare33 from './fare33';
import LookUpVacations from './LookUpVacations';
import CheapTicketFare from './CheapTicketFare';
import LookBestFare from './LookBestFare';
import JatTravels from './JatTravels';
import FlightFareBuddy from './FlightFareBuddy';
import LastFareDeals from './LastFareDeals';
import EazyFares from './EazyFares';
import UniJattFares from './UniJattFares';
import ReservationCentre from './ReservationCentre';
import Thebargaintrip from './Thebargaintrip';
import Travelomile from './Travelomile';
import TheJerseyFlights from './TheJerseyFlights';
import SkyDayTravel from './SkyDayTravel';
import FlyerCheaper from './FlyerCheaper';
import FindFlightCost from './FindFlightCost';
import MyCheapFlightTickets from './MyCheapFlightTickets';
import FlynFare from './FlynFare';
import traveloport from './traveloport';
import BestTicketFare from './BestTicketFare';
import TheFlightMaster from './TheFlightMaster';

const providers: Providers = {
  travofy,
  Rehlat,
  KIWI,
  edreams,
  amadeus,
  travomint,
  mytickets,
  kissandfly,
  Ryanair,
  qatarairways,
  transavia,
  travelpayout,
  Travelstart,
  olympicair,
  aegeanair,
  croatiaair,
  Emirates,
  // Cheapfaremart,
  skytours,
  etravlie,
  skybooker,
  tripmonster,
  Travelgenio,
  travel2be,
  travix,
  pegasus,
  goAsia,
  lolTravel,
  // Flightsmojo,
  flydubai,
  tripcom,
  flynas,
  Akbar,
  sunexpress,
  Travelwings,
  Avianca,
  scoot,
  tripleA,
  MyHolidays,
  aerocrs,
  tix,
  eurowings,
  Eilago,
  Safarni,
  combigo,
  Volario,
  condor,
  oneflightHub,
  Milhas123,
  WorldTourStore,
  FlyUnoMundo,
  cheapflightsbank,
  flightmover,
  // Airpaz,
  // Travelouts,
  FaresoFlights,
  // excelfares,
  // Destinia,
  // Truairfare,
  // easemytrip,
  // CheapFlightFares,
  Tripbookfly,
  Blueberry,
  Iwofly,
  Travoport,
  HolidayBreakz,
  BudgetTicket,
  FlyoDeals,
  Farehutz,
  Wizfair,
  wowTickets,
  FarePorto,
  Friendztravel,
  LafeTravel,
  Bookdreamfares,
  TravoDeals,
  thetravelmakers,
  Travelo1,
  FareCorner,
  fare33,
  LookUpVacations,
  CheapTicketFare,
  LookBestFare,
  JatTravels,
  FlightFareBuddy,
  LastFareDeals,
  EazyFares,
  UniJattFares,
  ReservationCentre,
  Thebargaintrip,
  Travelomile,
  TheJerseyFlights,
  SkyDayTravel,
  FlyerCheaper,
  FindFlightCost,
  MyCheapFlightTickets,
  FlynFare,
  traveloport,
  BestTicketFare,
  TheFlightMaster
};

export default providers;
