interface CountryInfo {
  countryName: string;
  fullDomainName: string;
  currencyCode: string;
  supportedLanguages: string[];
}

interface CountriesList {
  [key: string]: CountryInfo;
}

export const countriesList: CountriesList = {
  AR: {
    countryName: 'Argentina',
    fullDomainName: 'http://www.kayak.com.ar/',
    currencyCode: 'ARS',
    supportedLanguages: ['es']
  },
  AU: {
    countryName: 'Australia',
    fullDomainName: 'http://www.kayak.com.au/',
    currencyCode: 'AUD',
    supportedLanguages: ['en']
  },
  BE: {
    countryName: 'België',
    fullDomainName: 'http://www.be.kayak.com/',
    currencyCode: 'EUR',
    supportedLanguages: ['fr', 'nl']
  },
  BO: {
    countryName: 'Bolivia',
    fullDomainName: 'http://www.kayak.bo/',
    currencyCode: 'BOB',
    supportedLanguages: ['es']
  },
  BR: {
    countryName: 'Brasil',
    fullDomainName: 'http://www.kayak.com.br/',
    currencyCode: 'BRL',
    supportedLanguages: ['pt']
  },
  CA: {
    countryName: 'Canada',
    fullDomainName: 'http://www.ca.kayak.com/',
    currencyCode: 'CAD',
    supportedLanguages: ['en', 'fr']
  },
  CL: {
    countryName: 'Chile',
    fullDomainName: 'http://www.kayak.cl/',
    currencyCode: 'CLP',
    supportedLanguages: ['es']
  },
  CN: {
    countryName: '中国',
    fullDomainName: 'http://www.cn.kayak.com/',
    currencyCode: 'CNY',
    supportedLanguages: ['zh']
  },
  CO: {
    countryName: 'Colombia',
    fullDomainName: 'http://www.kayak.com.co/',
    currencyCode: 'COP',
    supportedLanguages: ['es']
  },
  CR: {
    countryName: 'Costa Rica',
    fullDomainName: 'http://www.kayak.co.cr/',
    currencyCode: 'CRC',
    supportedLanguages: ['es']
  },
  DK: {
    countryName: 'Danmark',
    fullDomainName: 'http://www.kayak.dk/',
    currencyCode: 'DKK',
    supportedLanguages: ['da']
  },
  DE: {
    countryName: 'Deutschland',
    fullDomainName: 'http://www.kayak.de/',
    currencyCode: 'EUR',
    supportedLanguages: ['de', 'en']
  },
  EC: {
    countryName: 'Ecuador',
    fullDomainName: 'http://www.kayak.com.ec/',
    currencyCode: 'USD',
    supportedLanguages: ['es']
  },
  SV: {
    countryName: 'El Salvador',
    fullDomainName: 'http://www.kayak.com.sv/',
    currencyCode: 'USD',
    supportedLanguages: ['es']
  },
  ES: {
    countryName: 'España',
    fullDomainName: 'http://www.kayak.es/',
    currencyCode: 'EUR',
    supportedLanguages: ['es', 'ca']
  },
  FR: {
    countryName: 'France',
    fullDomainName: 'http://www.kayak.fr/',
    currencyCode: 'EUR',
    supportedLanguages: ['fr']
  },
  GR: {
    countryName: 'Ελλάδα',
    fullDomainName: 'http://www.gr.kayak.com/',
    currencyCode: 'EUR',
    supportedLanguages: ['el']
  },
  GT: {
    countryName: 'Guatemala',
    fullDomainName: 'http://www.kayak.com.gt/',
    currencyCode: 'GTQ',
    supportedLanguages: ['es']
  },
  HN: {
    countryName: 'Honduras',
    fullDomainName: 'http://www.kayak.com.hn/',
    currencyCode: 'HNL',
    supportedLanguages: ['es']
  },
  HK: {
    countryName: '香港',
    fullDomainName: 'http://www.kayak.com.hk/',
    currencyCode: 'HKD',
    supportedLanguages: ['en', 'zh']
  },
  IN: {
    countryName: 'India',
    fullDomainName: 'http://www.kayak.co.in/',
    currencyCode: 'INR',
    supportedLanguages: ['en']
  },
  ID: {
    countryName: 'Indonesia',
    fullDomainName: 'http://www.kayak.co.id/',
    currencyCode: 'IDR',
    supportedLanguages: ['in', 'en']
  },
  IE: {
    countryName: 'Ireland',
    fullDomainName: 'http://www.kayak.ie/',
    currencyCode: 'EUR',
    supportedLanguages: ['en']
  },
  IT: {
    countryName: 'Italia',
    fullDomainName: 'http://www.kayak.it/',
    currencyCode: 'EUR',
    supportedLanguages: ['it']
  },
  JP: {
    countryName: '日本',
    fullDomainName: 'http://www.kayak.co.jp/',
    currencyCode: 'JPY',
    supportedLanguages: ['ja']
  },
  MY: {
    countryName: 'Malaysia',
    fullDomainName: 'http://www.kayak.com.my/',
    currencyCode: 'MYR',
    supportedLanguages: ['en', 'ms']
  },
  MX: {
    countryName: 'México',
    fullDomainName: 'http://www.kayak.com.mx/',
    currencyCode: 'MXN',
    supportedLanguages: ['es']
  },
  NL: {
    countryName: 'Nederland',
    fullDomainName: 'http://www.kayak.nl/',
    currencyCode: 'EUR',
    supportedLanguages: ['nl']
  },
  NZ: {
    countryName: 'New Zealand',
    fullDomainName: 'http://www.nz.kayak.com/',
    currencyCode: 'NZD',
    supportedLanguages: ['en']
  },
  NI: {
    countryName: 'Nicaragua',
    fullDomainName: 'http://www.kayak.com.ni/',
    currencyCode: 'NIO',
    supportedLanguages: ['es']
  },
  NO: {
    countryName: 'Norge',
    fullDomainName: 'http://www.kayak.no/',
    currencyCode: 'NOK',
    supportedLanguages: ['no']
  },
  PA: {
    countryName: 'Panamá',
    fullDomainName: 'http://www.kayak.com.pa/',
    currencyCode: 'USD',
    supportedLanguages: ['es']
  },
  PY: {
    countryName: 'Paraguay',
    fullDomainName: 'http://www.kayak.com.py/',
    currencyCode: 'PYG',
    supportedLanguages: ['es']
  },
  PE: {
    countryName: 'Perú',
    fullDomainName: 'http://www.kayak.com.pe/',
    currencyCode: 'PEN',
    supportedLanguages: ['es']
  },
  PH: {
    countryName: 'Philippines',
    fullDomainName: 'http://www.kayak.com.ph/',
    currencyCode: 'PHP',
    supportedLanguages: ['en']
  },
  PL: {
    countryName: 'Polska',
    fullDomainName: 'http://www.kayak.pl/',
    currencyCode: 'PLN',
    supportedLanguages: ['pl']
  },
  PT: {
    countryName: 'Portugal',
    fullDomainName: 'http://www.kayak.pt/',
    currencyCode: 'EUR',
    supportedLanguages: ['pt']
  },
  PR: {
    countryName: 'Puerto Rico',
    fullDomainName: 'http://www.kayak.com.pr/',
    currencyCode: 'USD',
    supportedLanguages: ['es']
  },
  DO: {
    countryName: 'República Dominicana',
    fullDomainName: 'http://www.kayak.com.do/',
    currencyCode: 'DOP',
    supportedLanguages: ['es']
  },
  RO: {
    countryName: 'România',
    fullDomainName: 'http://www.ro.kayak.com/',
    currencyCode: 'EUR',
    supportedLanguages: ['ro']
  },
  CH: {
    countryName: 'Schweiz',
    fullDomainName: 'http://www.kayak.ch/',
    currencyCode: 'CHF',
    supportedLanguages: ['fr', 'de']
  },
  SG: {
    countryName: 'Singapore',
    fullDomainName: 'http://www.kayak.sg/',
    currencyCode: 'SGD',
    supportedLanguages: ['en', 'zh']
  },
  ZA: {
    countryName: 'South Africa',
    fullDomainName: 'http://www.za.kayak.com/',
    currencyCode: 'ZAR',
    supportedLanguages: ['en']
  },
  KR: {
    countryName: '대한민국',
    fullDomainName: 'http://www.kayak.co.kr/',
    currencyCode: 'KRW',
    supportedLanguages: ['ko']
  },
  FI: {
    countryName: 'Suomi',
    fullDomainName: 'http://www.fi.kayak.com/',
    currencyCode: 'EUR',
    supportedLanguages: ['fi']
  },
  SE: {
    countryName: 'Sverige',
    fullDomainName: 'http://www.kayak.se/',
    currencyCode: 'SEK',
    supportedLanguages: ['sv']
  },
  TW: {
    countryName: '台灣',
    fullDomainName: 'http://www.tw.kayak.com/',
    currencyCode: 'TWD',
    supportedLanguages: ['zh']
  },
  TR: {
    countryName: 'Türkiye',
    fullDomainName: 'http://www.kayak.com.tr/',
    currencyCode: 'TRY',
    supportedLanguages: ['tr']
  },
  AE: {
    countryName: 'United Arab Emirates',
    fullDomainName: 'http://www.kayak.ae/',
    currencyCode: 'AED',
    supportedLanguages: ['en']
  },
  GB: {
    countryName: 'United Kingdom',
    fullDomainName: 'http://www.kayak.co.uk/',
    currencyCode: 'GBP',
    supportedLanguages: ['en']
  },
  US: {
    countryName: 'United States',
    fullDomainName: 'http://www.kayak.com/',
    currencyCode: 'USD',
    supportedLanguages: ['en']
  },
  UY: {
    countryName: 'Uruguay',
    fullDomainName: 'http://www.kayak.com.uy/',
    currencyCode: 'UYU',
    supportedLanguages: ['es']
  },
  VE: {
    countryName: 'Venezuela',
    fullDomainName: 'http://www.kayak.co.ve/',
    currencyCode: 'USD',
    supportedLanguages: ['es']
  },
  VN: {
    countryName: 'Việt Nam',
    fullDomainName: 'http://www.vn.kayak.com/',
    currencyCode: 'VND',
    supportedLanguages: ['en', 'vi']
  },
  AT: {
    countryName: 'Österreich',
    fullDomainName: 'http://www.at.kayak.com/',
    currencyCode: 'EUR',
    supportedLanguages: ['de']
  },
  CZ: {
    countryName: 'Česká republika',
    fullDomainName: 'http://www.cz.kayak.com/',
    currencyCode: 'CZK',
    supportedLanguages: ['cs']
  },
  UA: {
    countryName: 'Україна',
    fullDomainName: 'http://www.ua.kayak.com/',
    currencyCode: 'UAH',
    supportedLanguages: ['uk']
  },
  SA: {
    countryName: 'المملكة العربية السعودية',
    fullDomainName: 'http://www.kayak.sa/',
    currencyCode: 'SAR',
    supportedLanguages: ['ar', 'en']
  },
  TH: {
    countryName: 'ประเทศไทย',
    fullDomainName: 'http://www.kayak.co.th/',
    currencyCode: 'THB',
    supportedLanguages: ['th', 'en']
  }
};
