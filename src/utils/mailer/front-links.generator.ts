import querystring from 'query-string';
const FRONT_SEARCH_URL = 'https://travolic.com/flights/search';
export function transformToFrontSearchLink(
  searchOptions: SearchOptions
): string {
  let link = FRONT_SEARCH_URL;
  searchOptions.legs.forEach((leg) => {
    //CAI-LHR/2020-12-09/
    link += `/${leg.origin}-${leg.destination}/${leg.departure}`;
  });
  link += '?' + querystring.stringify(searchOptions);
  return link;
}
