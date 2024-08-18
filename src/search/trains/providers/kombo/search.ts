import axios from 'axios';
const {
  KOMBO_API_SEARCH,
  KOMBO_API_POLL_SEARCH,
  KOMBO_TOKEN,
  KOMBO_AFFILIATE_ID
} = process.env;
const search = async (input: SearchTrainOptions) => {
  // const originCityId=input.origin.kombo_code;
  // const destinationCityId=input.destination.kombo_code;
  const originCityId = 1;
  const destinationCityId = 11;
  if (originCityId === null || destinationCityId === null) return {};

  const url = `${KOMBO_API_SEARCH}${originCityId}/${destinationCityId}/${
    input.legs[0].departure
  }/${input.adults + input.children + input.infants}`;
  const urlR = `${KOMBO_API_SEARCH}${destinationCityId}/${originCityId}/${
    input.legs[1].departure
  }/${input.adults + input.children + input.infants}`;

  if (input.tripType == 'oneway') {
    const keyResult = await axios.get(url, {
      headers: {
        Token: KOMBO_TOKEN,
        AffiliateID: KOMBO_AFFILIATE_ID
      }
    });
    let data = await axios
      .get(`${KOMBO_API_POLL_SEARCH}${keyResult.data.key}`, {
        headers: {
          Token: KOMBO_TOKEN,
          AffiliateID: KOMBO_AFFILIATE_ID
        }
      })
      .then((res) => res.data)
      .catch((err) => {
        return err.message;
      });
    while (data['trips'].length === 0 || data['completed'] == false) {
      data = await axios
        .get(`${KOMBO_API_POLL_SEARCH}${keyResult.data.key}`, {
          headers: {
            Token: KOMBO_TOKEN,
            AffiliateID: KOMBO_AFFILIATE_ID
          }
        })
        .then((res) => res.data)
        .catch((err) => {
          return err.message;
        });
    }
    return data;
  } else {
    const keyResult = await axios.get(url, {
      headers: {
        Token: KOMBO_TOKEN,
        AffiliateID: KOMBO_AFFILIATE_ID
      }
    });
    let outBoundData = await axios
      .get(`${KOMBO_API_POLL_SEARCH}${keyResult.data.key}`, {
        headers: {
          Token: KOMBO_TOKEN,
          AffiliateID: KOMBO_AFFILIATE_ID
        }
      })
      .then((res) => res.data)
      .catch((err) => {
        return err.message;
      });

    while (outBoundData['trips'].length === 0) {
      outBoundData = await axios
        .get(`${KOMBO_API_POLL_SEARCH}${keyResult.data.key}`, {
          headers: {
            Token: KOMBO_TOKEN,
            AffiliateID: KOMBO_AFFILIATE_ID
          }
        })
        .then((res) => res.data)
        .catch((err) => {
          return err.message;
        });
    }

    const keyResult2 = await axios.get(urlR, {
      headers: {
        Token: KOMBO_TOKEN,
        AffiliateID: KOMBO_AFFILIATE_ID
      }
    });
    let inBoundData = await axios
      .get(`${KOMBO_API_POLL_SEARCH}${keyResult2.data.key}`, {
        headers: {
          Token: KOMBO_TOKEN,
          AffiliateID: KOMBO_AFFILIATE_ID
        }
      })
      .then((res) => res.data)
      .catch((err) => {
        return err.message;
      });
    while (inBoundData['trips'].length === 0) {
      inBoundData = await axios
        .get(`${KOMBO_API_POLL_SEARCH}${keyResult2.data.key}`, {
          headers: {
            Token: KOMBO_TOKEN,
            AffiliateID: KOMBO_AFFILIATE_ID
          }
        })
        .then((res) => res.data)
        .catch((err) => {
          return err.message;
        });
    }

    const data = {
      outBoundData: outBoundData,
      inBoundData: inBoundData
    };
    return data;
  }
};

export default search;
