import mozio from './mozio';
import intui from './intui';
import kiwitaxi from './kiwi-taxi';
import jayride from './jayride';
import AirportTransfer from './airportTransfer';
import getTransfer from './getTransfer';
import AtoB from './AtoB';

const providersTransfer: ProvidersTransfer = {
  mozio,
  intui,
  kiwitaxi,
  jayride,
  AirportTransfer,
  getTransfer,
  AtoB
};

export default providersTransfer;
