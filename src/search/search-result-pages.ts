export function getPageCheapest(
  data: any,
  maxAmount: number,
  currency: string
) {
  const result: any = {
    itineraries: {},
    legs: {},
    segments: {}
  };
  if (!data) return;
  Object.keys(data.itineraries).forEach((legId) => {
    const itinerary = data.itineraries[legId];
    // console.log(itinerary," itinerary log");
    if (itinerary && itinerary.pricingOptions) {
      itinerary.pricingOptions.forEach((pricingOption) => {
        if (pricingOption.price.currency == currency) {
          if (pricingOption.price.amount < maxAmount) {
            //add pricing options
            if (!result.itineraries[itinerary.id])
              result.itineraries[itinerary.id] = {
                ...itinerary,
                pricingOptions: [{ ...pricingOption }]
              };
            else {
              result.itineraries[itinerary.id].pricingOptions.push(
                pricingOption
              );
            }
            // add legs , segments
            itinerary.legs.forEach((iternaryLegId) => {
              result.legs[iternaryLegId] = data.legs[iternaryLegId];
              data.legs[iternaryLegId].segments.forEach((legSegmentId) => {
                result.segments[legSegmentId] = data.segments[legSegmentId];
              });
            });
          }
        }
      });
    }
  });
  return result;
}
