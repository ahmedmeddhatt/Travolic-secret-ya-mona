import axios from 'axios';
import airports from './airports.json';

const country = (airport) => {
  const result = airports.filter((item) => {
    if (item.code == airport) {
      return item;
    }
    return 0;
  });

  return result;
};

const codes = (array, country_id, province_name) => {
  const result = array.filter((item) => {
    if (item.country_id == country_id && item.province_name == province_name) {
      return item;
    }
    return 0;
  });

  return result;
};

const ConvertLegs = async (legs: SearchOptionLeg[]) => {
  const convertedLegs = [];

  for (let index = 0; index < legs.length; index++) {
    const leg = {
      origin_country_id: '',
      origin_province_name: '',
      departure: '',
      destination_country_id: '',
      destination_province_name: ''
    };

    let item = country(legs[index].origin);
    leg.origin_country_id = item[0].country_code;
    leg.origin_province_name = item[0].time_zone.split('/')[1];
    item = country(legs[index].destination);

    leg.destination_country_id = item[0].country_code;
    leg.destination_province_name = item[0].time_zone.split('/')[1];
    leg.departure = legs[index].departure;

    convertedLegs.push(leg);
  }

  const { data } = await axios.get(
    'https://api.12go.asia/province.json?key=334c39e0b01abfb68853ea7ebe49f285'
  );

  const returnedLegs = [];
  for (let index = 0; index < convertedLegs.length; index++) {
    const leg = { from: '', to: '', godate: '' };

    let item = codes(
      data,
      convertedLegs[index].origin_country_id,
      convertedLegs[index].origin_province_name
    );
    if (item.length == 0) {
      return [];
    }
    leg['from'] = item[0].province_id + 'p';
    item = codes(
      data,
      convertedLegs[index].destination_country_id,
      convertedLegs[index].destination_province_name
    );
    if (item.length == 0) {
      return [];
    }
    leg['to'] = item[0].province_id + 'p';
    leg['godate'] = convertedLegs[index].departure;
    returnedLegs.push(leg);
  }

  return returnedLegs;
};

const search = async (input: SearchOptions) => {
  const convertedLegs = await ConvertLegs(input.legs);
  if (convertedLegs.length == 0) {
    return {};
  }

  const results = { response: [] };

  for (let index = 0; index < convertedLegs.length; index++) {
    const url = `https://recheck10.12go.co/api/v1/search/${
      convertedLegs[index].from
    }/${convertedLegs[index].to}/${
      convertedLegs[index].godate
    }?k=334c39e0b01abfb68853ea7ebe49f285&type=avia&seats=${
      input.children + input.adults + input.infants
    }&lang=${input.language}&fxcode=${input.currency}`;
    const data = await fetch(url).then((res) => res.json());

    const items = [];

    if (data.recheck.length > 0) {
      const urls = [...new Set(data.recheck)] as string[];
      for (let index = 0; index < urls.length; index++) {
        const url = urls[index];
        const data = await fetch(url).then((res) => res.json());
        items.push(data);
      }
    }

    items.push(data);

    results.response.push(items);
  }

  return results;
};
export default search;
