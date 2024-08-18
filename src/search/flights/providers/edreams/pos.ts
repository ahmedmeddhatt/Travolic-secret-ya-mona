const POS = [
  {
    language: 'en',
    domain: '.ae',
    country: 'AE',
    locale: 'en_AE',
    currency: 'AED'
  },
  {
    language: 'es',
    domain: '.ar',
    country: 'AR',
    locale: 'es_AR',
    currency: 'ARS'
  },
  {
    language: 'en',
    domain: '.au',
    country: 'AU',
    locale: 'en_AU',
    currency: 'AUD'
  },
  {
    language: 'pt',
    domain: '.br',
    country: 'BR',
    locale: 'pt_BR',
    currency: 'BRL'
  },
  {
    language: 'en',
    domain: '.ca',
    country: 'CA',
    locale: 'en_CA',
    currency: 'CAD'
  },
  {
    language: 'fr',
    domain: '.ca',
    country: 'CA',
    locale: 'fr_CA',
    currency: 'CAD'
  },
  {
    language: 'fr',
    domain: '.ch',
    country: 'CH',
    locale: 'fr_CH',
    currency: 'CHF'
  },
  {
    language: 'de',
    domain: '.ch',
    country: 'CH',
    locale: 'de_CH',
    currency: 'CHF'
  },
  {
    language: 'it',
    domain: '.ch',
    country: 'CH',
    locale: 'it_CH',
    currency: 'CHF'
  },
  {
    language: 'es',
    domain: '.cl',
    country: 'CL',
    locale: 'es_CL',
    currency: 'CLP'
  },
  {
    language: 'es',
    domain: '.co',
    country: 'CO',
    locale: 'es_CO',
    currency: 'COP'
  },
  {
    language: 'de',
    domain: '.de',
    country: 'DE',
    locale: 'de_DE',
    currency: 'EUR'
  },
  {
    language: 'en',
    domain: '.eg',
    country: 'EG',
    locale: 'en_EG',
    currency: 'EGP'
  },
  {
    language: 'es',
    domain: '.es',
    country: 'ES',
    locale: 'es_ES',
    currency: 'EUR'
  },
  {
    language: 'fr',
    domain: '.fr',
    country: 'FR',
    locale: 'fr_FR',
    currency: 'EUR'
  },
  {
    language: 'gr',
    domain: '.gr',
    country: 'GR',
    locale: 'el_GR',
    currency: 'EUR'
  },
  {
    language: 'en',
    domain: 'hk',
    country: 'HK',
    locale: 'en_HK',
    currency: 'HKD'
  },

  {
    language: 'en',
    domain: '.in',
    country: 'IN',
    locale: 'en_IN',
    currency: 'INR'
  },
  {
    language: 'it',
    domain: '.it',
    country: 'IT',
    locale: 'it_IT',
    currency: 'EUR'
  },
  {
    languages: 'en',
    domain: '.ma',
    country: 'MA',
    locale: 'en_MA',
    currency: 'MAD'
  },
  {
    language: 'es',
    domain: '.mx',
    country: 'MX',
    locale: 'es_MX',
    currency: 'MXN'
  },
  {
    language: 'en',
    domain: '.net',
    country: 'US',
    locale: 'en_US',
    currency: 'USD'
  },
  {
    language: 'es',
    domain: '.net',
    country: 'US',
    locale: 'es_US',
    currency: 'USD'
  },
  {
    language: 'nl',
    domain: '.nl',
    country: 'NL',
    locale: 'nl_NL',
    currency: 'EUR'
  },
  {
    language: 'en',
    domain: '.nz',
    country: 'NZ',
    locale: 'en_NZ',
    currency: 'NZD'
  },
  {
    language: 'es',
    domain: '.pe',
    country: 'PE',
    locale: 'es_PE',
    currency: 'PEN'
  },
  {
    language: 'en',
    domain: '.ph',
    country: 'PH',
    locale: 'en_PH',
    currency: 'PHP'
  },
  {
    language: 'pt',
    domain: '.pt',
    country: 'PT',
    locale: 'pt_PT',
    currency: 'EUR'
  },
  {
    language: 'en',
    domain: '.sg',
    country: 'SG',
    locale: 'en_SG',
    currency: 'SGD'
  },
  {
    language: 'en',
    domain: '.th',
    country: 'TH',
    locale: 'en_TH',
    currency: 'THB'
  },
  {
    language: 'tr',
    domain: '.tr',
    country: 'TR',
    locale: 'tr',
    currency: 'TRY'
  },
  {
    language: 'en',
    domain: '.co.uk',
    country: 'GB',
    locale: 'en_GB',
    currency: 'GBP'
  },
  {
    language: 'es',
    domain: '.ve',
    country: 'VE',
    locale: 'es_VE',
    currency: 'VEF'
  },
  {
    language: 'en',
    domain: '.za',
    country: 'ZA',
    locale: 'en_ZA',
    currency: 'ZAR'
  },
  {
    language: 'de',
    domain: '.dk',
    country: 'DK',
    locale: 'da_DK',
    currency: 'DKK'
  },
  {
    language: 'fi',
    domain: '.fi',
    country: 'FI',
    locale: 'fi_FI',
    currency: 'EUR'
  },
  {
    lamguage: 'is',
    domain: '.is',
    country: 'IS',
    locale: 'is_IS',
    currency: 'ISK'
  },
  {
    language: 'no',
    domain: '.no',
    country: 'NO',
    locale: 'no_NO',
    currency: 'NOK'
  },
  {
    language: 'sv',
    domain: '.se',
    country: 'SE',
    locale: 'sv_SE',
    currency: 'SEK'
  },
  {
    language: 'pl',
    domain: '.pl',
    country: 'PL',
    locale: 'pl_PL',
    currency: 'PLN'
  },
  {
    language: 'zh',
    domain: '.cn',
    country: 'CN',
    locale: 'zh_CN',
    currency: 'CNY'
  },
  {
    language: 'en',
    domain: '.hk',
    country: 'HK',
    locale: 'en_HK',
    currency: 'HKD'
  },
  {
    language: 'en',
    domain: '.id',
    country: 'ID',
    locale: 'en_ID',
    currency: 'IDR'
  }
];

export default POS;
