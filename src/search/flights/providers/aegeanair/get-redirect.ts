const getRedirect = async (redirectId, payload) => {
  return `https://go.linkwi.se/z/73-0/CD23983/?lnkurl=${encodeURIComponent(
    payload.url
  )}`;
};

export default getRedirect;
