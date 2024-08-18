import currencyConverter from '../middlewares/currencyConverter';

export const flightsConvertResultsCurrencies = async (
  currency: string,
  transformedResults: TransformedResult | TransformedTransferResult,
  ip = '::1'
) => {
  const { itineraries } = transformedResults;
  if (!itineraries) return transformedResults;
  const itinerariesKeys = Object.keys(itineraries);
  const convertCurrency = await currencyConverter(currency, ip);

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
              const convertedPrice =
                pricingOption.price.currency !== currency
                  ? {
                      amount: convertCurrency(
                        pricingOption.price.amount,
                        pricingOption.price.currency
                      ).toFixed(2),
                      currency,
                      discount: pricingOption.price.discount
                        ? convertCurrency(
                            pricingOption.price.discount,
                            pricingOption.price.currency
                          ).toFixed(2)
                        : undefined,
                      person: pricingOption.price.person
                        ? convertCurrency(
                            pricingOption.price.person,
                            pricingOption.price.currency
                          ).toFixed(2)
                        : undefined
                    }
                  : {
                      amount: parseFloat(
                        pricingOption.price.amount.toString()
                      ).toFixed(2),
                      currency,
                      discount: pricingOption.price.discount
                        ? parseFloat(
                            pricingOption.price.discount.toString()
                          ).toFixed(2)
                        : undefined,
                      person: pricingOption.price.person
                        ? parseFloat(
                            pricingOption.price.person.toString()
                          ).toFixed(2)
                        : undefined
                    };

              return {
                ...pricingOption,
                price: {
                  ...pricingOption.price,
                  ...convertedPrice
                }
              };
            }
          )
        }
      };
    }, {})
  };
};

export const trainsConvertResultsCurrencies = async (
  currency: string,
  transformedResults: TransformedTrainResult
) => {
  const { outboundItineraries, inboundItineraries } = transformedResults;

  if (!outboundItineraries || !inboundItineraries) return transformedResults;

  const outboundItinerariesKeys = Object.keys(outboundItineraries);
  const inboundItinerariesKeys = Object.keys(inboundItineraries);

  const outboundConvertCurrency = await currencyConverter(currency);
  const inboundConvertCurrency = await currencyConverter(currency);

  return {
    ...transformedResults,
    outboundItineraries: outboundItinerariesKeys.reduce(
      (acc: any, currentKey: any) => {
        const currentItinerary = outboundItineraries[currentKey];
        return {
          ...acc,
          [currentKey]: {
            ...currentItinerary,
            pricingOptions: currentItinerary.pricingOptions.map(
              (pricingOption) => {
                const convertedPrice =
                  pricingOption.price.currency !== currency
                    ? {
                        amount: outboundConvertCurrency(
                          pricingOption.price.amount,
                          pricingOption.price.currency
                        ).toFixed(2),
                        currency,
                        discount: pricingOption.price.discount
                          ? outboundConvertCurrency(
                              pricingOption.price.discount,
                              pricingOption.price.currency
                            ).toFixed(2)
                          : undefined,
                        person: pricingOption.price.person
                          ? outboundConvertCurrency(
                              pricingOption.price.person,
                              pricingOption.price.currency
                            ).toFixed(2)
                          : undefined,
                        from: pricingOption.price.from
                          ? outboundConvertCurrency(
                              pricingOption.price.from,
                              pricingOption.price.currency
                            ).toFixed(2)
                          : undefined
                      }
                    : {
                        amount: parseFloat(
                          pricingOption.price.amount.toString()
                        ).toFixed(2),
                        currency,
                        discount: pricingOption.price.discount
                          ? parseFloat(
                              pricingOption.price.discount.toString()
                            ).toFixed(2)
                          : undefined,
                        person: pricingOption.price.person
                          ? parseFloat(
                              pricingOption.price.person.toString()
                            ).toFixed(2)
                          : undefined,
                        from: pricingOption.price.from
                          ? parseFloat(
                              pricingOption.price.from.toString()
                            ).toFixed(2)
                          : undefined
                      };

                return {
                  ...pricingOption,
                  price: {
                    ...pricingOption.price,
                    ...convertedPrice
                  }
                };
              }
            )
          }
        };
      },
      {}
    ),
    inboundItineraries: inboundItinerariesKeys.reduce(
      (acc: any, currentKey: any) => {
        const currentItinerary = inboundItineraries[currentKey];
        return {
          ...acc,
          [currentKey]: {
            ...currentItinerary,
            pricingOptions: currentItinerary.pricingOptions.map(
              (pricingOption) => {
                const convertedPrice =
                  pricingOption.price.currency !== currency
                    ? {
                        amount: inboundConvertCurrency(
                          pricingOption.price.amount,
                          pricingOption.price.currency
                        ).toFixed(2),
                        currency,
                        discount: pricingOption.price.discount
                          ? inboundConvertCurrency(
                              pricingOption.price.discount,
                              pricingOption.price.currency
                            ).toFixed(2)
                          : undefined,
                        person: pricingOption.price.person
                          ? inboundConvertCurrency(
                              pricingOption.price.person,
                              pricingOption.price.currency
                            ).toFixed(2)
                          : undefined
                      }
                    : {
                        amount: parseFloat(
                          pricingOption.price.amount.toString()
                        ).toFixed(2),
                        currency,
                        discount: pricingOption.price.discount
                          ? parseFloat(
                              pricingOption.price.discount.toString()
                            ).toFixed(2)
                          : undefined,
                        person: pricingOption.price.person
                          ? parseFloat(
                              pricingOption.price.person.toString()
                            ).toFixed(2)
                          : undefined
                      };

                return {
                  ...pricingOption,
                  price: {
                    ...pricingOption.price,
                    ...convertedPrice
                  }
                };
              }
            )
          }
        };
      },
      {}
    )
  };
};
