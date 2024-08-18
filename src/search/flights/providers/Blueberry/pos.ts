const POS = {
  country: ['US', 'GB'],
  providerName: {
    US: 'Dialforflights',
    GB: 'Bestairfare'
  },
  URL: {
    start: {
      US: 'http://fapi.dialforflights.com/api/flight/StartSearch',
      GB: 'http://fapi.bestairfare.co.uk/api/flight/StartSearch'
    },
    getResult: {
      US: 'http://fapi.dialforflights.com/api/flight/getsearchresult',
      GB: 'http://fapi.bestairfare.co.uk/api/flight/getsearchresult'
    }
  }
};

export default POS;
