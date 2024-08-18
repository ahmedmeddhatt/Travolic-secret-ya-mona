import moment from 'moment';
import {
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs,
  encodeRedirectPayload
} from '../../../../utils';
const providerName = 'BudgetTicket';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const createID = (seg: any) => {
  const transFormedSegment: TransformedSegmentWithoutID = {
    origin: seg.Origin,
    destination: seg.Destination,
    departure: moment
      .utc(seg.Departure_DateTime, 'MM/DD/YYYY HH:mm')
      .format('YYYYMMDDHHmm'),
    arrival: moment
      .utc(seg.Arrival_DateTime, 'MM/DD/YYYY HH:mm')
      .format('YYYYMMDDHHmm'),
    marketingCarrier: seg.Airline_Code,
    operatingCarrier: seg.Airline_Code,
    marketingFlightNumber: seg.Flight_Number,
    vehicleType: 'FLIGHT'
  };
  return transFormedSegment;
};

const getCheck_In_Baggage = (Check_In_Baggage) => {
  let baggageObj = {};
  const baggageArr = Check_In_Baggage.split(' ');
  if (baggageArr.length === 1) {
    baggageObj = {
      pieces: null,
      weight: Number(Check_In_Baggage.split('')[0])
    };
  } else if (baggageArr.length === 2) {
    baggageObj = {
      pieces: null,
      weight: Number(baggageArr[0])
    };
  } else if (baggageArr.length === 4) {
    baggageObj = {
      pieces: Number(baggageArr[0]),
      weight: Number(baggageArr[2])
    };
  }

  return baggageObj;
};

const getHand_Baggage = (Hand_Baggage) => {
  let handBaggageObj = {};
  const handBaggageArr = Hand_Baggage.split(' ');
  if (handBaggageArr.length === 1) {
    handBaggageObj = {
      pieces: null,
      weight: Number(Hand_Baggage.split('')[0])
    };
  } else if (handBaggageArr.length === 2) {
    handBaggageObj = {
      pieces: null,
      weight: Number(handBaggageArr[0])
    };
  } else if (handBaggageArr.length > 2) {
    handBaggageObj = {
      pieces: Number(handBaggageArr[0]),
      weight: null
    };
  }

  return handBaggageObj;
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
    codeShare: {}
  };
  transformedResult.agents[agent.id] = agent;

  if (
    !data ||
    Object.keys(data).length === 0 ||
    Object.keys(data['TripDetails']).length === 0
  ) {
    transformedResult.error = 'No data found.';
    return transformedResult;
  }
  const baseURL = data['DL_URL'];
  const inLegs = [];
  const outLegs = [];
  const inBaggages = [];
  const outBaggages = [];
  const outboundFlights =
    data['TripDetails'][0]['Trip_Id'] === 0
      ? data['TripDetails'][0]
      : data['TripDetails'][1];
  const inboundFlights =
    options.tripType === 'round'
      ? data['TripDetails'][0]['Trip_Id'] === 0
        ? data['TripDetails'][1]
        : data['TripDetails'][0]
      : [];
  for (const flight of outboundFlights.Flights) {
    let adultFees = 0,
      childFees = 0,
      infantFees = 0;
    for (const price of flight['Fares'][0]['FareDetails']) {
      if (price['PAX_Type'] === 0) {
        adultFees = price['Total_Amount'];
      } else if (price['PAX_Type'] === 1) {
        childFees = price['Total_Amount'];
      } else {
        infantFees = price['Total_Amount'];
      }

      const Check_In_BaggageObj = getCheck_In_Baggage(
        price['Free_Baggage']['Check_In_Baggage']
      );

      const Hand_BaggageObj = getHand_Baggage(
        price['Free_Baggage']['Hand_Baggage']
      );

      outBaggages.push({ Check_In_BaggageObj, Hand_BaggageObj });
    }
    const legAmount =
      adultFees * options.adults +
      childFees * options.children +
      infantFees * options.infants;
    const legSegments: TransformedSegment[] = [];
    for (const seg of flight.Segments) {
      const transFormedSegment: TransformedSegmentWithoutID = createID(seg);
      const Segment = buildSegment(transFormedSegment);
      legSegments.push(Segment);
      transformedResult.segments[Segment.id] = Segment;
      transformedResult.codeShare[`${seg.Airline_Code}${seg.Flight_Number}`] = {
        marketingCarrier: seg.Airline_Code,
        operatingCarrier: seg.Airline_Code,
        aircraftType: seg.aircraftType
      };
    }
    const leg = buildLegFromSegments(legSegments);
    const obj = {
      leg,
      legAmount,
      url: flight['Flight_DL_URL']
    };
    outLegs.push(obj);
    transformedResult.legs[leg.id] = leg;
  }

  if (options.tripType === 'round')
    for (const flight of inboundFlights.Flights) {
      let adultFees = 0,
        childFees = 0,
        infantFees = 0;
      for (const price of flight['Fares'][0]['FareDetails']) {
        if (price['PAX_Type'] === 0) {
          adultFees = price['Total_Amount'];
        } else if (price['PAX_Type'] === 1) {
          childFees = price['Total_Amount'];
        } else {
          infantFees = price['Total_Amount'];
        }

        const Check_In_BaggageObj = getCheck_In_Baggage(
          price['Free_Baggage']['Check_In_Baggage']
        );
        const Hand_BaggageObj = getHand_Baggage(
          price['Free_Baggage']['Hand_Baggage']
        );

        inBaggages.push({ Check_In_BaggageObj, Hand_BaggageObj });
      }
      const legAmount =
        adultFees * options.adults +
        childFees * options.children +
        infantFees * options.infants;
      const legSegments: TransformedSegment[] = [];
      for (const seg of flight.Segments) {
        const transFormedSegment: TransformedSegmentWithoutID = createID(seg);
        const Segment = buildSegment(transFormedSegment);
        legSegments.push(Segment);
        transformedResult.segments[Segment.id] = Segment;
        transformedResult.codeShare[`${seg.Airline_Code}${seg.Flight_Number}`] =
          {
            marketingCarrier: seg.Airline_Code,
            operatingCarrier: seg.Airline_Code,
            aircraftType: seg.aircraftType ?? undefined
          };
      }
      const leg = buildLegFromSegments(legSegments);
      const obj = {
        leg,
        legAmount,
        url: flight['Flight_DL_URL']
      };
      inLegs.push(obj);
      transformedResult.legs[leg.id] = leg;
    }

  for (const outLeg of outLegs) {
    if (options.tripType === 'round') {
      let inLegIndex = 0;
      for (const inLeg of inLegs) {
        const itinerary = buildItineraryFromLegs([outLeg.leg, inLeg.leg]);
        const encodedDeepLink = encodeRedirectPayload({
          provider: providerName,
          agentId: agent.id,
          agentName: agent.name,
          url: `${baseURL}${outLeg.url},${inLeg.url}&utm_source=travolic`
        });

        const inBaggagesObj = inBaggages[inLegIndex];
        const outBaggagesObj = outBaggages[inLegIndex];
        const baggagesPCs = [];
        const baggagesWeights = [];
        const handBaggagesPCs = [];
        const handBaggagesWeights = [];

        // ----------- for inBaggagesObj (Baggages) -----------
        if (inBaggagesObj.Check_In_BaggageObj.pieces !== null) {
          baggagesPCs.push(inBaggagesObj.Check_In_BaggageObj.pieces);
        }

        if (inBaggagesObj.Check_In_BaggageObj.weight !== null) {
          baggagesWeights.push(inBaggagesObj.Check_In_BaggageObj.weight);
        }

        // for inBaggagesObj (Hand Baggages)
        if (inBaggagesObj.Hand_BaggageObj.pieces !== null) {
          handBaggagesPCs.push(inBaggagesObj.Hand_BaggageObj.pieces);
        }

        if (inBaggagesObj.Hand_BaggageObj.weight !== null) {
          handBaggagesWeights.push(inBaggagesObj.Hand_BaggageObj.weight);
        }

        // ----------- for outBaggagesObj (Baggages) -----------
        if (outBaggagesObj.Check_In_BaggageObj.pieces !== null) {
          baggagesPCs.push(outBaggagesObj.Check_In_BaggageObj.pieces);
        }

        if (outBaggagesObj.Check_In_BaggageObj.weight !== null) {
          baggagesWeights.push(outBaggagesObj.Check_In_BaggageObj.weight);
        }

        // for outBaggagesObj (Hand Baggages)
        if (outBaggagesObj.Hand_BaggageObj.pieces !== null) {
          handBaggagesPCs.push(outBaggagesObj.Hand_BaggageObj.pieces);
        }

        if (outBaggagesObj.Hand_BaggageObj.weight !== null) {
          handBaggagesWeights.push(outBaggagesObj.Hand_BaggageObj.weight);
        }

        let meta = {};
        if (baggagesPCs.length > 0 || baggagesWeights.length > 0) {
          const totalBaggages =
            baggagesPCs.length > 0 ? Math.max(...baggagesPCs) : undefined;
          const BaggagesInKilos =
            baggagesWeights.length > 0
              ? Math.max(...baggagesWeights)
              : undefined;
          const totalHandbages =
            handBaggagesPCs.length > 0
              ? Math.max(...handBaggagesPCs)
              : undefined;
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
              amount: outLeg.legAmount + inLeg.legAmount,
              currency: 'INR'
            },
            meta: Object.keys(meta).length > 0 ? meta : undefined
          }
        ];
        transformedResult.itineraries[itinerary.id] = itinerary;
        inLegIndex++;
      }
    } else if (options.tripType === 'oneway') {
      let inLegIndex = 0;
      const itinerary = buildItineraryFromLegs([outLeg.leg]);
      const encodedDeepLink = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: `${baseURL}${outLeg.url}&utm_source=travolic`
      });

      const outBaggagesObj = outBaggages[inLegIndex];
      const baggagesPCs = [];
      const baggagesWeights = [];
      const handBaggagesPCs = [];
      const handBaggagesWeights = [];

      // ----------- for outBaggagesObj (Baggages) -----------
      if (outBaggagesObj.Check_In_BaggageObj.pieces !== null) {
        baggagesPCs.push(outBaggagesObj.Check_In_BaggageObj.pieces);
      }

      if (outBaggagesObj.Check_In_BaggageObj.weight !== null) {
        baggagesWeights.push(outBaggagesObj.Check_In_BaggageObj.weight);
      }

      // for outBaggagesObj (Hand Baggages)
      if (outBaggagesObj.Hand_BaggageObj.pieces !== null) {
        handBaggagesPCs.push(outBaggagesObj.Hand_BaggageObj.pieces);
      }

      if (outBaggagesObj.Hand_BaggageObj.weight !== null) {
        handBaggagesWeights.push(outBaggagesObj.Hand_BaggageObj.weight);
      }

      let meta = {};
      if (baggagesPCs.length > 0 || baggagesWeights.length > 0) {
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
            amount: outLeg.legAmount,
            currency: 'INR'
          },
          meta: Object.keys(meta).length > 0 ? meta : undefined
        }
      ];
      transformedResult.itineraries[itinerary.id] = itinerary;
      inLegIndex++;
    }
  }

  return transformedResult;
};
export default transformResults;
