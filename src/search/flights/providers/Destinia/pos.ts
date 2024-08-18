const remiteConverter = {
  US: 'us',
  GB: 'gb',
  AE: 'ae',
  DE: 'de',
  CA: 'ca',
  FR: 'fr',
  SA: 'sa',
  IN: 'in',
  QA: 'qa',
  KW: 'kw',
  AU: 'au',
  IT: 'it',
  CO: 'co',
  TR: 'tr',
  ES: 'es'
};

const getRemite = (country) => {
  return `travolicflg/${
    remiteConverter[country] ? remiteConverter[country] : 'us'
  }`;
};

export default getRemite;
