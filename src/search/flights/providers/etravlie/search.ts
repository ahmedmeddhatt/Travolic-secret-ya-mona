import querystring from 'querystring';
import axios from 'axios';
import logger from '../../../../configs/logger';
import brands from './brands';

const { ETRAVLI_API_KEY, ETRAVLI_API_URL } = process.env;

const cabinClassMap: IDictionary<string> = {
  Economy: 'Y',
  Premium_Economy: 'S',
  First: 'F',
  Business: 'C'
};

const transformOptions = (options: SearchOptions) => {
  const {
    legs,
    currency,
    country,
    language,
    adults,
    children,
    infants,
    cabinClass
  } = options;

  return {
    token: ETRAVLI_API_KEY,
    legs: legs,
    curr: currency,
    country: country,
    language: language,
    D1: adults,
    D2: children,
    D3: infants,
    format: 'json',
    cabin: cabinClassMap[cabinClass]
  };
};

const search = async (input: SearchOptions) => {
  const options = transformOptions(input);

  const convertedLegs = convertLegs(options.legs);
  const convertedPassengers = convertTravellers(
    options.D1,
    options.D2,
    options.D3
  );
  const countryKey = brands[options.country];
  if (!countryKey) {
    return {};
  }
  const { status } = countryKey;

  if (status && status === 'bypass') {
    let languageKey = countryKey[options.language];

    if (!languageKey) {
      languageKey = countryKey.default;
      options.language = languageKey.selectedLanguage;
      options.country = languageKey.country;
    }

    options.country = languageKey.country;

    const currencyKey = languageKey.currency.includes(options.curr);

    if (!currencyKey) {
      options.curr = languageKey.defaultCurrency;
    }
    const countryBrands = languageKey.brands;

    const payload = {
      token: options.token,
      bounds: convertedLegs,
      travellers: convertedPassengers,
      country: options.country,
      customerLanguage: options.language,
      customerCurrency: options.curr,
      cabin: options.cabin,
      onlydirectflights: 'false',
      devicetype: 'PC',
      applicationtype: 'BROWSER',
      useragent:
        'Mozilla/5.0%20(Macintosh;%20Intel%20Mac%20OS%20X%2010_13_3)%20AppleWebKit/537.36%20(KHTML,%20like%20Gecko)%20Chrome/65.0.3325.181%20Safari/537.36',
      format: options.format,
      responseUsage: 'PRICE_COMPARISON',
      brand: undefined
    };

    const results = await Promise.all(
      countryBrands.map(async (brand: string) => {
        payload.brand = brand;

        const requestURL = decodeURIComponent(
          `${ETRAVLI_API_URL}?${querystring.stringify(payload)}`
        );

        const result = await axios
          .get(requestURL, {
            headers: {
              'content-type': 'application/json',
              Accept: 'text/json'
            }
          })
          .then((res) => res.data)
          .catch((err) => {
            logger.error(err);
            return {};
          });

        return {
          ...result,
          brand: brand
        };
      })
    );

    return results;
  } else {
    let languageKey = countryKey[options.language];
    if (!languageKey) {
      languageKey = countryKey.default;
      options.language = languageKey.selectedLanguage;
    }
    const currencyKey = languageKey.currency.includes(options.curr);

    if (!currencyKey) {
      options.curr = languageKey.defaultCurrency;
    }

    const countryBrands = languageKey.brands;

    const payload = {
      token: options.token,
      bounds: convertedLegs,
      travellers: convertedPassengers,
      country: options.country,
      customerLanguage: options.language,
      customerCurrency: options.curr,
      cabin: options.cabin,
      onlydirectflights: 'false',
      devicetype: 'PC',
      applicationtype: 'BROWSER',
      useragent:
        'Mozilla/5.0%20(Macintosh;%20Intel%20Mac%20OS%20X%2010_13_3)%20AppleWebKit/537.36%20(KHTML,%20like%20Gecko)%20Chrome/65.0.3325.181%20Safari/537.36',
      format: options.format,
      responseUsage: 'PRICE_COMPARISON',
      brand: undefined
    };

    const results = await Promise.all(
      countryBrands.map(async (brand: string) => {
        payload.brand = brand;

        const requestURL = decodeURIComponent(
          `${ETRAVLI_API_URL}?${querystring.stringify(payload)}`
        );
        const result = await axios
          .get(requestURL, {
            headers: {
              'content-type': 'application/json',
              Accept: 'text/json'
            }
          })
          .then((res) => res.data)
          .catch((err) => {
            logger.error(err);
            return {};
          });

        return {
          ...result,
          brand: brand
        };
      })
    );

    return results;
  }
};

const convertLegs = (legs: SearchOptionLeg[]): string => {
  return legs
    .map((leg) => `${leg.origin}${leg.destination}${leg.departure}`)
    .join(',');
};

const convertTravellers = (
  adults: number,
  children: number,
  infants: number
) => {
  let travellers = '';

  for (let index = 0; index < adults; index++) {
    travellers = travellers + 't' + (index + 1);
    if (index < adults - 1 || children > 0 || infants > 0) {
      travellers += ',';
    }
  }
  for (let index = 0; index < children; index++) {
    travellers = travellers + 'c' + (index + 1) + ':9';
    if (index < children - 1 || infants > 0) {
      travellers += ',';
    }
  }
  for (let index = 0; index < infants; index++) {
    travellers = travellers + 'i' + (index + 1) + ':1';
    if (index != infants - 1) {
      travellers += ',';
    }
  }
  return travellers;
};

export default search;
