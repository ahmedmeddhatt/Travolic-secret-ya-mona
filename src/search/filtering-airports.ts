export const filteringAirports = async (
  input: SearchOptions,
  transformedResult: TransformedResult
) => {
  const { itineraries, legs } = transformedResult;

  if (Object.keys(itineraries).length === 0) {
    transformedResult.agents = {};
    return transformedResult;
  }

  if (input.tripType === 'oneway') {
    if (input.legs[0].orig_city && input.legs[0].dest_city) {
      return transformedResult;
    } else if (input.legs[0].orig_city && !input.legs[0].dest_city) {
      for (const itinerary in itineraries) {
        const result = itinerary.split('-');
        if (input.legs[0].destination !== result[4]) {
          for (const leg of itineraries[itinerary].legs) delete legs[leg];
          delete itineraries[itinerary];
        }
      }
    } else if (!input.legs[0].orig_city && input.legs[0].dest_city) {
      for (const itinerary in itineraries) {
        const result = itinerary.split('-');
        if (input.legs[0].origin !== result[0]) {
          for (const leg of itineraries[itinerary].legs) delete legs[leg];
          delete itineraries[itinerary];
        }
      }
    } else if (
      input.legs[0].orig_city === false &&
      input.legs[0].dest_city === false
    ) {
      for (const itinerary in itineraries) {
        const result = itinerary.split('-');
        if (
          input.legs[0].origin !== result[0] ||
          input.legs[0].destination !== result[4]
        ) {
          for (const leg of itineraries[itinerary].legs) delete legs[leg];
          delete itineraries[itinerary];
        }
      }
    }

    if (Object.keys(itineraries).length === 0) {
      transformedResult.agents = {};
    }

    return transformedResult;
  } else {
    if (input.legs[0].orig_city && input.legs[0].dest_city) {
      return transformedResult;
    } else if (input.legs[0].orig_city && !input.legs[0].dest_city) {
      for (const itinerary in itineraries) {
        const legSplit = itinerary.split('|');
        if (legSplit.length > 1) {
          const resultOutbound = legSplit[0].split('-');
          const resultInbound = legSplit[1].split('-');
          if (
            input.legs[0].destination !== resultOutbound[4] ||
            input.legs[1].origin !== resultInbound[0]
          ) {
            delete itineraries[itinerary];
          }
        }
      }
    } else if (!input.legs[0].orig_city && input.legs[0].dest_city) {
      for (const itinerary in itineraries) {
        const legSplit = itinerary.split('|');
        if (legSplit.length > 1) {
          const resultOutbound = legSplit[0].split('-');
          const resultInbound = legSplit[1].split('-');
          if (
            input.legs[0].origin !== resultOutbound[0] ||
            input.legs[1].destination !== resultInbound[4]
          ) {
            delete itineraries[itinerary];
          }
        }
      }
    } else if (
      input.legs[0].orig_city === false &&
      input.legs[0].dest_city === false
    ) {
      for (const itinerary in itineraries) {
        const legSplit = itinerary.split('|');
        if (legSplit.length > 1) {
          const resultOutbound = legSplit[0].split('-');
          const resultInbound = legSplit[1].split('-');
          if (
            input.legs[0].origin !== resultOutbound[0] ||
            input.legs[0].destination !== resultOutbound[4] ||
            input.legs[1].origin !== resultInbound[0] ||
            input.legs[1].destination !== resultInbound[4]
          ) {
            delete itineraries[itinerary];
          }
        }
      }
    }

    if (Object.keys(itineraries).length === 0) {
      transformedResult.agents = {};
    }

    return transformedResult;
  }
};

export const findCheapestPrice = async (
  input: SearchOptions,
  transformedResult: TransformedResult
) => {
  if (input.cabinClass == 'Economy') {
    let minimumPrice: any = {};
    minimumPrice[Object.keys(transformedResult.itineraries)[0]] =
      transformedResult.itineraries[
        Object.keys(transformedResult.itineraries)[0]
      ];

    for (const itinerary in transformedResult.itineraries) {
      if (
        transformedResult.itineraries[itinerary]['pricingOptions'].length > 1
      ) {
        let minPrice =
          transformedResult.itineraries[itinerary]['pricingOptions'][0];

        transformedResult.itineraries[itinerary]['pricingOptions'].filter(
          async (price, index) => {
            if (price['price']['amount'] < minPrice['price']['amount']) {
              minPrice =
                transformedResult.itineraries[itinerary]['pricingOptions'][
                  index
                ];
            }
          }
        );
        transformedResult.itineraries[itinerary]['pricingOptions'] = [];
        transformedResult.itineraries[itinerary]['pricingOptions'].push(
          minPrice
        );
      }
      if (
        transformedResult.itineraries[itinerary]['pricingOptions'][0]['price'][
          'amount'
        ] <
        minimumPrice[Object.keys(minimumPrice)[0]]['pricingOptions'][0][
          'price'
        ]['amount']
      ) {
        minimumPrice = {};
        minimumPrice[itinerary] = transformedResult.itineraries[itinerary];
      }
    }
    transformedResult.itineraries = minimumPrice;
    if (Object.keys(transformedResult.itineraries).length == 0) {
      return {
        agents: {},
        legs: {},
        itineraries: {},
        segments: {}
      };
    } else {
      return transformedResult;
    }
  } else {
    return transformedResult;
  }
};

export const dividePrice = async (
  input: SearchOptions,
  transformedResults: TransformedResult
) => {
  if (input.infants === 0 && input.children === 0) {
    const { itineraries } = transformedResults;

    if (!itineraries) return transformedResults;

    const itinerariesKeys = Object.keys(itineraries);

    return {
      ...transformedResults,
      itineraries: itinerariesKeys.reduce((acc, currentKey) => {
        const currentItinerary = itineraries[currentKey];
        return {
          ...acc,
          [currentKey]: {
            ...currentItinerary,
            pricingOptions: currentItinerary.pricingOptions.map(
              (pricingOption) => {
                return {
                  ...pricingOption,
                  price: {
                    ...pricingOption.price,
                    person: pricingOption.price.amount / input.adults
                  }
                };
              }
            )
          }
        };
      }, {})
    };
  }
  return transformedResults;
};
