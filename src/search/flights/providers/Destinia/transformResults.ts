import moment from 'moment';
import {
  buildItineraryFromLegs,
  buildLegFromSegments,
  buildSegment,
  encodeRedirectPayload
} from '../../../../utils';
import getRemite from './pos';

const providerName = 'Destinia';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};
const reFormateOptions = (options) => {
  return options.reduce((previousOpject, option) => {
    // console.log(previousOpject);
    return {
      ...previousOpject,
      [option.optionId]: option
    };
  }, {});
};

const transformResults = (
  options: SearchOptions,
  data: any
): TransformedResult => {
  const transformedResult: TransformedResult = {
    agents: {},
    legs: {},
    itineraries: {},
    segments: {}
  };
  if (!data || Object.keys(data).length === 0 || !data['services']) {
    transformedResult['error'] = 'No data found';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;
  let Segments: TransformedSegment[] = [];
  let Legs: TransformedLeg[] = [];
  const servicesResults = data['services'];
  const optionsResults = reFormateOptions(data['options']);
  const currency = data['currencyCode'];
  const BASEURL = `http://destinia.com/www/r.php?remite=${getRemite(
    options.country
  )}&url=${data.url}`;
  if (options.tripType === 'oneway') {
    servicesResults.forEach((item) => {
      const optionIds = item['journeys'][0]['options'];
      optionIds.forEach((id) => {
        const idsServices = id['optionId'];
        const deepLink = `${BASEURL}&transport_selected_options[0]=${idsServices}&srp=${item.priceDetail.srp}`;
        const option = optionsResults[idsServices];
        const price =
          parseFloat(item['priceDetail']['totalAmount']) +
          parseFloat(item['priceDetail']['totalFee']);
        option['segments'].forEach((seg) => {
          const depDate = seg.departureInfo.dateTime;
          const arrDate = seg.arrivalInfo.dateTime;
          const transFormedSegment: TransformedSegmentWithoutID = {
            origin: seg['departureInfo']['airport']['iataCode'],
            destination: seg['arrivalInfo']['airport']['iataCode'],
            departure: moment
              .utc(`${depDate}`, 'YYYY-MM-DD HH:mm')
              .format('YYYYMMDDHHmm'),
            arrival: moment
              .utc(`${arrDate}`, 'YYYY-MM-DD HH:mm')
              .format('YYYYMMDDHHmm'),
            marketingCarrier: seg['airline']['iataCode'],
            operatingCarrier: seg['operatorAirline']['iataCode'],
            marketingFlightNumber: seg['transportId'],
            vehicleType: 'FLIGHT'
          };
          const segment = buildSegment(transFormedSegment);
          Segments.push(segment);
          transformedResult.segments[segment.id] = segment;
        });
        const Leg = buildLegFromSegments(Segments);
        Legs.push(Leg);
        transformedResult.legs[Leg.id] = Leg;
        Segments = [];

        const itinerary = buildItineraryFromLegs(Legs);
        const encodedDeepLink = encodeRedirectPayload({
          provider: providerName,
          agentId: agent.id,
          agentName: agent.name,
          url: deepLink
        });
        itinerary.pricingOptions = [
          {
            agent: agent.id,
            agentName: agent.name,
            deepLink: encodedDeepLink,
            price: {
              amount: price,
              currency: currency
            }
          }
        ];

        transformedResult.itineraries[itinerary.id] = itinerary;
        Legs = [];
      }); //options
    }); //service
  } else {
    servicesResults.forEach((item) => {
      const optionIds = item['journeys'][0]['options'];
      optionIds.forEach((id) => {
        const idsServices = id['optionId'];
        const option = optionsResults[idsServices];
        const price =
          parseFloat(item['priceDetail']['totalAmount']) +
          parseFloat(item['priceDetail']['totalFee']);
        option['segments'].forEach((seg) => {
          const depDate = seg.departureInfo.dateTime;
          const arrDate = seg.arrivalInfo.dateTime;
          const transFormedSegment: TransformedSegmentWithoutID = {
            origin: seg['departureInfo']['airport']['iataCode'],
            destination: seg['arrivalInfo']['airport']['iataCode'],
            departure: moment
              .utc(`${depDate}`, 'YYYY-MM-DD HH:mm')
              .format('YYYYMMDDHHmm'),
            arrival: moment
              .utc(`${arrDate}`, 'YYYY-MM-DD HH:mm')
              .format('YYYYMMDDHHmm'),
            marketingCarrier: seg['airline']['iataCode'],
            operatingCarrier: seg['operatorAirline']['iataCode'],
            marketingFlightNumber: seg['transportId'],
            vehicleType: 'FLIGHT'
          };
          const segment = buildSegment(transFormedSegment);
          Segments.push(segment);
          transformedResult.segments[segment.id] = segment;
        });
        const Leg = buildLegFromSegments(Segments);
        Legs.push(Leg);
        transformedResult.legs[Leg.id] = Leg;
        Segments = [];
        const optionIdsReturn = item['journeys'][1]['options'];
        let combinedLegs: TransformedLeg[] = [];
        optionIdsReturn.forEach((returnId) => {
          const returnIdsServices = returnId['optionId'];
          const deepLink = `${BASEURL}&transport_selected_options[0]=${idsServices}&transport_selected_options[1]=${returnIdsServices}&srp=${item.priceDetail.srp}`;
          const returnOption = optionsResults[returnIdsServices];
          returnOption['segments'].forEach((seg) => {
            const depDate = seg.departureInfo.dateTime;
            const arrDate = seg.arrivalInfo.dateTime;
            const transFormedSegment: TransformedSegmentWithoutID = {
              origin: seg['departureInfo']['airport']['iataCode'],
              destination: seg['arrivalInfo']['airport']['iataCode'],
              departure: moment
                .utc(`${depDate}`, 'YYYY-MM-DD HH:mm')
                .format('YYYYMMDDHHmm'),
              arrival: moment
                .utc(`${arrDate}`, 'YYYY-MM-DD HH:mm')
                .format('YYYYMMDDHHmm'),
              marketingCarrier: seg['airline']['iataCode'],
              operatingCarrier: seg['operatorAirline']['iataCode'],
              marketingFlightNumber: seg['transportId'],
              vehicleType: 'FLIGHT'
            };
            const segment = buildSegment(transFormedSegment);
            Segments.push(segment);
            transformedResult.segments[segment.id] = segment;
          });
          const Leg = buildLegFromSegments(Segments);
          combinedLegs = [...Legs];
          combinedLegs.push(Leg);
          transformedResult.legs[Leg.id] = Leg;
          Segments = [];
          const itinerary = buildItineraryFromLegs(combinedLegs);
          const encodedDeepLink = encodeRedirectPayload({
            provider: providerName,
            agentId: agent.id,
            agentName: agent.name,
            url: deepLink
          });
          itinerary.pricingOptions = [
            {
              agent: agent.id,
              agentName: agent.name,
              deepLink: encodedDeepLink,
              price: {
                amount: price,
                currency: currency
              }
            }
          ];

          transformedResult.itineraries[itinerary.id] = itinerary;
        });
        Legs = [];
      }); //options
    }); //service
  }

  return transformedResult;
};

export default transformResults;
