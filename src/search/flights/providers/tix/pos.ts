const {
  TIX_NL_PASSWORD,
  TIX_DE_PASSWORD,
  TIX_PL_PASSWORD,
  TIX_ES_PASSWORD,
  TIX_FR_PASSWORD,
  TIX_BE_PASSWORD,
  TIX_IT_PASSWORD,
  TIX_IE_PASSWORD,
  TIX_CA_PASSWORD,
  TIX_PT_PASSWORD,
  TIX_AT_PASSWORD,
  TIX_DK_PASSWORD,
  TIX_GB_PASSWORD,
  TIX_CH_PASSWORD,
  TIX_GR_PASSWORD,
  TIX_SE_PASSWORD,
  TIX_FI_PASSWORD,
  TIX_NO_PASSWORD
} = process.env;

const pos = [
  {
    country: 'NL',
    provider: 'Gate 1',
    login: 'TravolicNL',
    password: TIX_NL_PASSWORD
  },
  {
    country: 'DE',
    provider: 'Flight Tix',
    login: 'TravolicDE',
    password: TIX_DE_PASSWORD
  },
  {
    country: 'PL',
    provider: 'Flight Tix',
    login: 'TravolicPL',
    password: TIX_PL_PASSWORD
  },
  {
    country: 'ES',
    provider: 'Tix',
    login: 'TravolicES',
    password: TIX_ES_PASSWORD
  },
  {
    country: 'FR',
    provider: 'Tix',
    login: 'TravolicFR',
    password: TIX_FR_PASSWORD
  },
  {
    country: 'BE',
    provider: 'Tix',
    login: 'TravolicBE',
    password: TIX_BE_PASSWORD
  },
  {
    country: 'IT',
    provider: 'Flight Tix',
    login: 'TravolicIT',
    password: TIX_IT_PASSWORD
  },
  {
    country: 'IE',
    provider: 'Gate 1',
    login: 'TravolicIE',
    password: TIX_IE_PASSWORD
  },
  {
    country: 'CA',
    provider: 'Gate 1',
    login: 'TravolicCA',
    password: TIX_CA_PASSWORD
  },
  {
    country: 'PT',
    provider: 'Tix',
    login: 'TravolicPT',
    password: TIX_PT_PASSWORD
  },
  {
    country: 'AT',
    provider: 'Gate 1',
    login: 'TravolicAT',
    password: TIX_AT_PASSWORD
  },
  {
    country: 'DK',
    provider: 'Flight Tix',
    login: 'TravolicDK',
    password: TIX_DK_PASSWORD
  },
  {
    country: 'GB',
    provider: 'Gate 1',
    login: 'TravolicUK',
    password: TIX_GB_PASSWORD
  },
  {
    country: 'CH',
    provider: 'Gate 1',
    login: 'TravolicCH',
    password: TIX_CH_PASSWORD
  },
  {
    country: 'GR',
    provider: 'Tix',
    login: 'TravolicGR',
    password: TIX_GR_PASSWORD
  },
  {
    country: 'SE',
    provider: 'Flight Tix',
    login: 'TravolicSE',
    password: TIX_SE_PASSWORD
  },
  {
    country: 'FI',
    provider: 'Flight Tix',
    login: 'TravolicFI',
    password: TIX_FI_PASSWORD
  },
  {
    country: 'NO',
    provider: 'Flight Tix',
    login: 'TravolicNO',
    password: TIX_NO_PASSWORD
  }
];

export default pos;
