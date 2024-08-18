import moment from 'moment';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';
const providerName = 'FlynFare';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const filterSegemtData = (flight: any) => {
  const departureDate = `${flight.departure.date}T${flight.departure.time}`;
  const arrivalDate = `${flight.arrival.date}T${flight.arrival.time}`;

  const transFormedSegment: TransformedSegmentWithoutID = {
    origin: flight.departure.code,
    destination: flight.arrival.code,
    departure: moment
      .utc(departureDate, 'DD-MM-YYYYTHH:mm')
      .format('YYYYMMDDHHmm'),
    arrival: moment.utc(arrivalDate, 'DD-MM-YYYYTHH:mm').format('YYYYMMDDHHmm'),
    marketingCarrier:
      flight.marketingCarrier !== null
        ? flight.marketingCarrier
        : flight.airlineCode,
    operatingCarrier:
      flight.operatingCarrier.code !== null
        ? flight.operatingCarrier.code
        : flight.airlineCode,
    marketingFlightNumber: flight.fltNum,
    vehicleType: 'FLIGHT'
  };

  return transFormedSegment;
};

const setCodeShare = (marketingCarrier, operatingCarrier, equipType?) => {
  const segMarketingCarrier =
    marketingCarrier !== null ? marketingCarrier : operatingCarrier;
  const codeShareObj = {
    marketingCarrier: segMarketingCarrier,
    operatingCarrier: operatingCarrier,
    aircraftType: equipType
  };

  return codeShareObj;
};

const transformResults = (
  input: SearchOptions,
  data: any
): TransformedResult => {
  const transformedResult: TransformedResult = {
    agents: {},
    segments: {},
    legs: {},
    itineraries: {},
    codeShare: {},
    flightDetails: data
  };
  transformedResult.agents[agent.id] = agent;

  if (!data || data.length === 0) {
    transformedResult['error'] = 'No result found';
    return transformedResult;
  }

  const offers = data;
  for (const offer of offers) {
    const totalPrice = offer.grandTotal,
      { currency } = offer,
      url = offer.landingUrl,
      baggagesPCs = [],
      baggagesWeights = [],
      handBaggagesPCs = [],
      handBaggagesWeights = [];

    let outboundLeg = [];
    const inboundLeg = [];
    if (input.tripType === 'oneway') {
      outboundLeg = offer.sectors;
    } else if (input.tripType === 'round') {
      const flightSectors = offer.sectors;
      for (const flightSector of flightSectors) {
        if (flightSector.group === '0') {
          outboundLeg.push(flightSector);
        } else if (flightSector.group === '1') {
          inboundLeg.push(flightSector);
        }
      }
    }

    let Segments: TransformedSegment[] = [];
    const Legs: TransformedLeg[] = [];
    for (const seg of outboundLeg) {
      const transFormedSegment: TransformedSegmentWithoutID =
        filterSegemtData(seg);
      const Segemnt = buildSegment(transFormedSegment);
      Segments.push(Segemnt);
      transformedResult.segments[Segemnt.id] = Segemnt;
      const codeShareObj = setCodeShare(
        seg.marketingCarrier,
        seg.operatingCarrier.code,
        seg.equipType
      );
      transformedResult.codeShare[
        `${codeShareObj.marketingCarrier}${seg.fltNum}`
      ] = codeShareObj;
      const { baggageInfo, handBaggage } = seg;

      if (baggageInfo !== '' || baggageInfo !== null) {
        const baggagesInfoArr = baggageInfo.split(' ');
        if (baggagesInfoArr[1] === 'Pcs') {
          if (baggagesInfoArr[0] > 0) {
            baggagesPCs.push(baggagesInfoArr[0]);
          }
        } else if (baggagesInfoArr[1] === 'Kilograms') {
          if (baggagesInfoArr[0] > 0) {
            baggagesWeights.push(baggagesInfoArr[0]);
          }
        }
      }

      if (handBaggage !== '' || handBaggage !== null) {
        const handBaggageArr = handBaggage.split(' ');
        if (handBaggageArr[1] === 'Pcs') {
          if (handBaggageArr[0] > 0) {
            handBaggagesPCs.push(handBaggageArr[0]);
          }
        } else if (handBaggageArr[1] === 'Kilograms') {
          if (handBaggageArr[0] > 0) {
            handBaggagesWeights.push(handBaggageArr[0]);
          }
        }
      }
    }
    let Leg = buildLegFromSegments(Segments);
    Legs.push(Leg);
    transformedResult.legs[Leg.id] = Leg;
    Segments = [];

    if (input.tripType === 'round') {
      for (const seg of inboundLeg) {
        const transFormedSegment: TransformedSegmentWithoutID =
          filterSegemtData(seg);
        const Segemnt = buildSegment(transFormedSegment);
        Segments.push(Segemnt);
        transformedResult.segments[Segemnt.id] = Segemnt;
        const codeShareObj = setCodeShare(
          seg.marketingCarrier,
          seg.operatingCarrier.code,
          seg.equipType
        );
        transformedResult.codeShare[
          `${codeShareObj.marketingCarrier}${seg.fltNum}`
        ] = codeShareObj;

        const { baggageInfo, handBaggage } = seg;
        if (baggageInfo !== '' || baggageInfo !== null) {
          const baggagesInfoArr = baggageInfo.split(' ');
          if (baggagesInfoArr[1] === 'Pcs') {
            if (baggagesInfoArr[0] > 0) {
              baggagesPCs.push(baggagesInfoArr[0]);
            }
          } else if (baggagesInfoArr[1] === 'Kilograms') {
            if (baggagesInfoArr[0] > 0) {
              baggagesWeights.push(baggagesInfoArr[0]);
            }
          }
        }

        if (handBaggage !== '' || handBaggage !== null) {
          const handBaggageArr = handBaggage.split(' ');
          if (handBaggageArr[1] === 'Pcs') {
            if (handBaggageArr[0] > 0) {
              handBaggagesPCs.push(handBaggageArr[0]);
            }
          } else if (handBaggageArr[1] === 'Kilograms') {
            if (handBaggageArr[0] > 0) {
              handBaggagesWeights.push(handBaggageArr[0]);
            }
          }
        }
      }
      Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
    }
    const itinerary = buildItineraryFromLegs(Legs);
    const encodedDeepLink = encodeRedirectPayload({
      provider: providerName,
      agentId: agent.id,
      agentName: agent.name,
      url
    });

    let meta = {};
    if (
      baggagesPCs.length > 0 ||
      baggagesWeights.length > 0 ||
      handBaggagesPCs.length > 0 ||
      handBaggagesWeights.length > 0
    ) {
      const totalBaggages =
        baggagesPCs.length > 0 ? Math.max(...baggagesPCs) : undefined;
      const BaggagesInKilos =
        baggagesWeights.length > 0 ? Math.max(...baggagesWeights) : undefined;
      const totalHandbages =
        handBaggagesPCs.length > 0 ? Math.max(...handBaggagesPCs) : undefined;
      const HandbagesInKilos =
        handBaggagesWeights.length > 0
          ? Math.max(...handBaggagesWeights)
          : undefined;

      if (
        totalBaggages !== undefined ||
        BaggagesInKilos !== undefined ||
        totalHandbages !== undefined ||
        HandbagesInKilos !== undefined
      ) {
        meta = {
          baggage: {
            totalBaggages,
            BaggagesInKilos,
            totalHandbages,
            HandbagesInKilos
          }
        };
      }
    }

    itinerary.pricingOptions = [
      {
        agent: agent.id,
        agentName: agent.name,
        deepLink: encodedDeepLink,
        price: {
          amount: totalPrice,
          currency
        },
        meta: Object.keys(meta).length > 0 ? meta : undefined
      }
    ];

    transformedResult.itineraries[itinerary.id] = itinerary;
  }

  return transformedResult;
};
export default transformResults;
