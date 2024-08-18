import moment from 'moment';
import * as utils from '../../../../utils';

const providerName = 'qatarairways';
const agent = {
  id: Buffer.from('Qatar Airways').toString('base64'),
  name: 'Qatar Airways',
  isAirline: true
};
const cabinClassMap: IDictionary<string> = {
  Economy: 'E',
  First: 'F',
  Business: 'B'
};
const tripTypesMap: IDictionary<string> = {
  oneway: 'O',
  round: 'R'
};

const transformResults = (
  options: SearchOptions,
  data: any
): TransformedResult => {
  const transformedResult: TransformedResult = {
    agents: {},
    legs: {},
    itineraries: {},
    segments: {},
    flightDetails: data
  };

  if (
    Object.keys(data).length === 0 ||
    !data.PricedItineraries ||
    data.PricedItineraries[0].PricedItinerary.length < 1
  ) {
    transformedResult['error'] = 'No data found';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  const pricedItineraries = data.PricedItineraries[0].PricedItinerary;

  for (const pricedItinerary of pricedItineraries) {
    const TotalPriceInfo =
      pricedItinerary.AirItineraryPricingInfo[0].ItinTotalFare[0].TotalFare[0]
        .$;
    const currency = TotalPriceInfo.CurrencyCode;
    const price = parseFloat(TotalPriceInfo.Amount);
    const tripPrice = {
      amount: price,
      currency
    };
    const redirectUrl = `https://booking.qatarairways.com/nsp/views/showBooking.action?widget=BF&selLang=en&tripType=${
      tripTypesMap[options.tripType]
    }&fromStation=${options.legs[0].origin}&toStation=${
      options.legs[0].destination
    }&departing=${options.legs[0].departure}&returning=${
      options.legs[1] ? options.legs[1].departure : undefined
    }&bookingClass=${cabinClassMap[options.cabinClass]}&adults=${
      options.adults
    }&children=${options.children}&infants=${
      options.infants
    }&searchType=F&addTaxToFare=Y&flexibleDate=off&minPurTime=null&upsellCallId=100&isMetaSearch=true`;
    const outboundLegs = [];
    const returnLegs = [];
    const OriginDestinationOptions =
      pricedItinerary.AirItinerary[0].OriginDestinationOptions[0]
        .OriginDestinationOption;

    for (const element of OriginDestinationOptions) {
      const flightSegments = element.FlightSegment;
      const optionSegments = [];
      const fltNumber = [];

      for (const flightSegment of flightSegments) {
        const transformedSegment = utils.buildSegment({
          origin: flightSegment.DepartureAirport[0].$.LocationCode,
          destination: flightSegment.ArrivalAirport[0].$.LocationCode,
          departure: moment
            .utc(flightSegment.$.DepartureDateTime.split('+')[0])
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(flightSegment.$.ArrivalDateTime.split('+')[0])
            .format('YYYYMMDDHHmm'),
          marketingCarrier:
            flightSegment.MarketingAirline[0].$.CompanyShortName,
          marketingFlightNumber: flightSegment.$.FlightNumber,
          operatingCarrier:
            flightSegment.MarketingAirline[0].$.CompanyShortName,
          vehicleType: 'FLIGHT'
        });

        fltNumber.push(flightSegment.$.FlightNumber);
        transformedResult.segments[transformedSegment.id] = transformedSegment;
        optionSegments.push(transformedSegment);
      }

      const leg = utils.buildLegFromSegments(optionSegments);
      transformedResult.legs[leg.id] = leg;

      if (leg.origin === options.legs[0].origin) {
        leg['outboundFltNumber'] = fltNumber.join(',');
        outboundLegs.push(leg);
      } else if (
        options.tripType === 'round' &&
        leg.origin === options.legs[1].origin
      ) {
        leg['outboundFltNumber'] = fltNumber.join(',');
        returnLegs.push(leg);
      }
    }

    let trips;
    if (options.tripType === 'round') {
      trips = outboundLegs.reduce((acc, outLeg) => {
        return [...acc, ...returnLegs.map((returnLeg) => [outLeg, returnLeg])];
      }, []);
    } else if (options.tripType === 'oneway') {
      trips = outboundLegs.map((outboundLeg) => {
        return [outboundLeg];
      });
    }

    for (const trip of trips) {
      const tripItinerary = utils.buildItineraryFromLegs(trip);
      let itinerary;

      if (transformedResult.itineraries[tripItinerary.id]) {
        itinerary = transformedResult.itineraries[tripItinerary.id];
        if (itinerary.pricingOptions[0].price.amount > tripPrice.amount) {
          if (trip.length == 2) {
            itinerary.pricingOptions = [
              {
                agent: agent.id,
                agentName: agent.name,
                deepLink: utils.encodeRedirectPayload({
                  provider: providerName,
                  agentId: agent.id,
                  agentName: agent.name,
                  url:
                    redirectUrl +
                    `&outboundFltNumber=${trip[0].outboundFltNumber}&inboundFltNumber=${trip[1].outboundFltNumber}&price=${price}&CID=TMALL445260`
                }),
                price: tripPrice
              }
            ];
          } else {
            itinerary.pricingOptions = [
              {
                agent: agent.id,
                agentName: agent.name,
                deepLink: utils.encodeRedirectPayload({
                  provider: providerName,
                  agentId: agent.id,
                  agentName: agent.name,
                  url:
                    redirectUrl +
                    `&outboundFltNumber=${trip[0].outboundFltNumber}&price=${price}&CID=TMALL445260`
                }),
                price: tripPrice
              }
            ];
          }
        }
      } else {
        itinerary = tripItinerary;
        if (trip.length == 2) {
          itinerary.pricingOptions = [
            {
              agent: agent.id,
              agentName: agent.name,
              deepLink: utils.encodeRedirectPayload({
                provider: providerName,
                agentId: agent.id,
                agentName: agent.name,
                url:
                  redirectUrl +
                  `&outboundFltNumber=${trip[0].outboundFltNumber}&inboundFltNumber=${trip[1].outboundFltNumber}&price=${price}&CID=TMALL445260`
              }),
              price: tripPrice
            }
          ];
        } else {
          itinerary.pricingOptions = [
            {
              agent: agent.id,
              agentName: agent.name,
              deepLink: utils.encodeRedirectPayload({
                provider: providerName,
                agentId: agent.id,
                agentName: agent.name,
                url:
                  redirectUrl +
                  `&outboundFltNumber=${trip[0].outboundFltNumber}&price=${price}&CID=TMALL445260`
              }),
              price: tripPrice
            }
          ];
        }
      }

      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  }

  return transformedResult;
};

export default transformResults;
