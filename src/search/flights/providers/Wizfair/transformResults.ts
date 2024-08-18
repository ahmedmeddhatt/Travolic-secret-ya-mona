import moment from 'moment';
import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

const providerName = 'Wizfair';
const agent = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const transformResults = (
  options: SearchOptions,
  data: any
): TransformedResult => {
  const transformedResult: TransformedResult = {
    agents: {},
    segments: {},
    legs: {},
    itineraries: {},
    codeShare: {}
  };
  transformedResult.agents[agent.id] = agent;
  if (Object.keys(data).length === 0 || data.Items === null) {
    transformedResult['error'] = 'No result found';
    return transformedResult;
  }

  const descriptionHandBagg = 'CARRY ON HAND BAGGAGE';

  if (options.tripType === 'oneway') {
    for (const trip of data['Items']) {
      const Segments: TransformedSegment[] = [];
      const Legs: TransformedLeg[] = [];
      const baggagesNums = [];
      const handBaggagesNums = [];
      for (const seg of trip['Sectors']) {
        const {
          Arrival,
          Departure,
          FltNum,
          MrktCarrier,
          OptrCarrier,
          EquipType,
          AirV,
          Baggage_Info
        } = seg;
        const depdateTime = `${Departure.Date}${Departure.Time}`;
        const arrdateTime = `${Arrival.Date}${Arrival.Time}`;
        const departure = Departure.AirportCode;
        const arrival = Arrival.AirportCode;
        const transformedSegment: TransformedSegmentWithoutID = {
          origin: departure,
          destination: arrival,
          departure: moment
            .utc(depdateTime, 'YYYY-MM-DDHH:mm')
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(arrdateTime, 'YYYY-MM-DDHH:mm')
            .format('YYYYMMDDHHmm'),
          marketingCarrier: MrktCarrier,
          operatingCarrier: OptrCarrier,
          marketingFlightNumber: FltNum,
          vehicleType: 'FLIGHT'
        };
        const segment = buildSegment(transformedSegment);
        Segments.push(segment);
        transformedResult.segments[segment.id] = segment;
        transformedResult.codeShare[`${AirV}${FltNum}`] = {
          marketingCarrier: MrktCarrier,
          operatingCarrier: OptrCarrier ?? MrktCarrier,
          aircraftType: EquipType
        };

        if (Baggage_Info !== null) {
          const { BaggageInfoDetails } = Baggage_Info;
          for (const baggageInfo of BaggageInfoDetails) {
            const { NoOfPieces, Description1 } = baggageInfo;
            const piecesNum = NoOfPieces.split('')[0];
            if (piecesNum > 0) {
              if (Description1 === descriptionHandBagg) {
                handBaggagesNums.push(piecesNum);
              } else {
                baggagesNums.push(piecesNum);
              }
            }
          }
        }
      }

      const leg = buildLegFromSegments(Segments);
      Legs.push(leg);
      transformedResult.legs[leg.id] = leg;

      const itinerary = buildItineraryFromLegs(Legs);

      const deepLinkpayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: trip['url']
      });

      let metaBaggagesOptions;
      if (baggagesNums.length > 0 || handBaggagesNums.length > 0) {
        metaBaggagesOptions = {
          baggage: {
            totalBaggages:
              baggagesNums.length > 0 ? Math.max(...baggagesNums) : undefined,
            totalHandbages:
              handBaggagesNums.length > 0
                ? Math.max(...handBaggagesNums)
                : undefined
          }
        };
      } else {
        metaBaggagesOptions = false;
      }

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkpayload,
          price: {
            amount: trip['GrandTotal'],
            currency: trip['Currency']
          },
          meta: metaBaggagesOptions !== false ? metaBaggagesOptions : undefined
        }
      ];
      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  } else {
    for (const trip of data['Items']) {
      const outBoundLegs: TransformedLeg[] = [];
      const inBoundLegs: TransformedLeg[] = [];
      const outBoundSegments: TransformedSegment[] = [];
      const inBoundSegments: TransformedSegment[] = [];
      const baggagesNums = [];
      const handBaggagesNums = [];

      for (const seg of trip['Sectors']) {
        if (seg.IsReturn === false) {
          const {
            Arrival,
            Departure,
            FltNum,
            MrktCarrier,
            OptrCarrier,
            EquipType,
            AirV,
            Baggage_Info
          } = seg;
          const depdateTime = `${Departure.Date}${Departure.Time}`;
          const arrdateTime = `${Arrival.Date}${Arrival.Time}`;
          const departure = seg.Departure.AirportCode;
          const arrival = seg.Arrival.AirportCode;
          const transformedSegment: TransformedSegmentWithoutID = {
            origin: departure,
            destination: arrival,
            departure: moment
              .utc(depdateTime, 'YYYY-MM-DDHH:mm')
              .format('YYYYMMDDHHmm'),
            arrival: moment
              .utc(arrdateTime, 'YYYY-MM-DDHH:mm')
              .format('YYYYMMDDHHmm'),
            marketingCarrier: MrktCarrier,
            operatingCarrier: OptrCarrier,
            marketingFlightNumber: FltNum,
            vehicleType: 'FLIGHT'
          };
          const segment = buildSegment(transformedSegment);
          outBoundSegments.push(segment);
          transformedResult.segments[segment.id] = segment;
          transformedResult.codeShare[`${AirV}${FltNum}`] = {
            marketingCarrier: MrktCarrier,
            operatingCarrier: OptrCarrier ?? MrktCarrier,
            aircraftType: EquipType
          };

          if (Baggage_Info !== null) {
            const { BaggageInfoDetails } = Baggage_Info;
            for (const baggageInfo of BaggageInfoDetails) {
              const { NoOfPieces, Description1 } = baggageInfo;
              const piecesNum = NoOfPieces.split('')[0];
              if (piecesNum > 0) {
                if (Description1 === descriptionHandBagg) {
                  handBaggagesNums.push(piecesNum);
                } else {
                  baggagesNums.push(piecesNum);
                }
              }
            }
          }
        } else {
          const {
            Arrival,
            Departure,
            FltNum,
            MrktCarrier,
            OptrCarrier,
            Baggage_Info
          } = seg;
          const depdateTime = `${Departure.Date}${Departure.Time}`;
          const arrdateTime = `${Arrival.Date}${Arrival.Time}`;
          const departure = seg.Departure.AirportCode;
          const arrival = seg.Arrival.AirportCode;
          const transformedSegment: TransformedSegmentWithoutID = {
            origin: departure,
            destination: arrival,
            departure: moment
              .utc(depdateTime, 'YYYY-MM-DDHH:mm')
              .format('YYYYMMDDHHmm'),
            arrival: moment
              .utc(arrdateTime, 'YYYY-MM-DDHH:mm')
              .format('YYYYMMDDHHmm'),
            marketingCarrier: MrktCarrier,
            operatingCarrier: OptrCarrier,
            marketingFlightNumber: FltNum,
            vehicleType: 'FLIGHT'
          };
          const segment = buildSegment(transformedSegment);
          inBoundSegments.push(segment);
          transformedResult.segments[segment.id] = segment;

          if (Baggage_Info !== null) {
            const { BaggageInfoDetails } = Baggage_Info;
            for (const baggageInfo of BaggageInfoDetails) {
              const { NoOfPieces, Description1 } = baggageInfo;
              const piecesNum = NoOfPieces.split('')[0];
              if (piecesNum > 0) {
                if (Description1 === descriptionHandBagg) {
                  handBaggagesNums.push(piecesNum);
                } else {
                  baggagesNums.push(piecesNum);
                }
              }
            }
          }
        }
      }
      const outBoundleg = buildLegFromSegments(outBoundSegments);
      const inBoundLeg = buildLegFromSegments(inBoundSegments);

      outBoundLegs.push(outBoundleg);
      inBoundLegs.push(inBoundLeg);

      transformedResult.legs[outBoundleg.id] = outBoundleg;
      transformedResult.legs[inBoundLeg.id] = inBoundLeg;

      const itinerary = buildItineraryFromLegs([
        outBoundLegs[0],
        inBoundLegs[0]
      ]);

      const deepLinkpayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: trip['url']
      });

      let metaBaggagesOptions;
      if (baggagesNums.length > 0 || handBaggagesNums.length > 0) {
        metaBaggagesOptions = {
          baggage: {
            totalBaggages:
              baggagesNums.length > 0 ? Math.max(...baggagesNums) : undefined,
            totalHandbages:
              handBaggagesNums.length > 0
                ? Math.max(...handBaggagesNums)
                : undefined
          }
        };
      } else {
        metaBaggagesOptions = false;
      }

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkpayload,
          price: {
            amount: trip['GrandTotal'],
            currency: trip['Currency']
          },
          meta: metaBaggagesOptions !== false ? metaBaggagesOptions : undefined
        }
      ];
      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  }
  return transformedResult;
};
export default transformResults;
