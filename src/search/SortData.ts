import moment from 'moment';
import { getJSON, setJSON } from '../utils/cache.util';

export const SortDataByPrice = async (
  searchId: string,
  Data: TransformedResult
) => {
  if (!searchId) return Data;
  const { itineraries } = Data;
  const currentPrices: any[] = [],
    sortedPrices: any[] = [];
  const preMappedPrices = (await getJSON(`mapping_prices_${searchId}`)) || [];

  Object.keys(itineraries).forEach((itinerary: any) => {
    itineraries[itinerary]['pricingOptions'].forEach((pricingOption) => {
      const price = pricingOption.price.amount;
      const { agentName } = pricingOption;
      currentPrices.push({ id: itinerary, price, agentName });
    });
  });
  if (currentPrices.length)
    sortedPrices.push(
      ...currentPrices.sort((a: any, b: any) => a.price - b.price)
    );

  Data['mappingPrices'] = merage(preMappedPrices, sortedPrices, 'price');
  setJSON(`mapping_prices_${searchId}`, Data['mappingPrices'], {
    duration: moment.duration({
      // ? we need it for just avg 10 minutes
      minutes: 10
    })
  });
  return Data;
};

export const SortDataByDuration = async (
  searchId: string,
  Data: TransformedResult
) => {
  if (!searchId) return Data;
  const { itineraries, legs } = Data;
  const currentDurations: any[] = [],
    sortedDurations: any[] = [];
  const preMappedDurations =
    (await getJSON(`mapping_durations_${searchId}`)) || [];

  Object.keys(itineraries).forEach((itinerary: any) => {
    const duration = itineraries[itinerary]['legs'].reduce(
      (totalDuration, leg) => {
        return totalDuration + legs[leg]['duration'];
      },
      0
    );
    currentDurations.push({ id: itinerary, duration });
  });
  if (currentDurations.length)
    sortedDurations.push(
      ...currentDurations.sort((a: any, b: any) => a.duration - b.duration)
    );

  Data['mappingDurations'] = merage(
    preMappedDurations,
    sortedDurations,
    'duration'
  );
  setJSON(`mapping_durations_${searchId}`, Data['mappingDurations'], {
    duration: moment.duration({
      // ? we need it for just avg 10 minutes
      minutes: 10
    })
  });
  return Data;
};

const merage = (arr1: any[], arr2: any[], field: string) => {
  const newArray: any[] = [];
  let i = 0,
    j = 0;
  while (i < arr1.length && j < arr2.length) {
    if (parseFloat(arr1[i][field]) < parseFloat(arr2[j][field])) {
      newArray.push(arr1[i]);
      i++;
    } else {
      newArray.push(arr2[j]);
      j++;
    }
  }
  while (i < arr1.length) {
    newArray.push(arr1[i]);
    i++;
  }
  while (j < arr2.length) {
    newArray.push(arr2[j]);
    j++;
  }
  return newArray;
};
