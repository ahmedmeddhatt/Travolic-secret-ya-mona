import {
  encodeRedirectPayload,
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs
} from '../../../../utils';

import moment from 'moment';

const providerName = 'Cheapfaremart';

const agent: IDictionary<string> = {
  id: Buffer.from(providerName).toString('base64'),
  name: providerName
};

const transformResults = (
  options: SearchOptions,
  data: any
): TransformedResult => {
  const transformedResult = {
    agents: {},
    legs: {},
    itineraries: {},
    segments: {},
    codeShare: {}
  };

  if (Object.keys(data).length === 0) {
    transformedResult['error'] = 'No data found';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  const results = data['FlightPricerResponse'][0];
  const flightResults =
    results['FlightPricerResult'][0]['Itineraries'][0]['Itinerary'];

  for (const flight of flightResults) {
    const Legs: TransformedLeg[] = [];
    let Segments: TransformedSegment[] = [];
    const totalBaggages = [];
    const BaggagesInKilos = [];

    const segmentsBookingCodes = {};

    const deeplink = flight['URL'][0];
    const currency = flight['Currency'][0];
    const price = flight['TotalPrice'][0];
    const segsData = flight['Sectors'][0]['AirSector'];
    if (options.tripType == 'oneway') {
      for (const seg of segsData) {
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: seg['From'][0],
          destination: seg['To'][0],
          departure: moment
            .utc(
              `${seg['DepartDate'][0]}${seg['DepartTime'][0]}`,
              'DD/MM/YYYY HH:mm'
            )
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(
              `${seg['ArrivalDate'][0]}${seg['ArrivalTime'][0]}`,
              'DD/MM/YYYY HH:mm'
            )
            .format('YYYYMMDDHHmm'),
          operatingCarrier: seg['AirV'][0],
          marketingCarrier: seg['AirV'][0],
          marketingFlightNumber: seg['FltNum'][0],
          vehicleType: 'FLIGHT'
        };
        let KGs, PCs;
        !seg.BaggageInfo
          ? 0
          : seg.BaggageInfo[0].split(' ')[1] === 'KG'
          ? (KGs = seg.BaggageInfo[0].split(' ')[0])
          : (PCs = seg.BaggageInfo[0].split(' ')[0]);

        const segment = buildSegment(transFormedSegment);

        Segments.push(segment);
        totalBaggages.push(Number(PCs));
        BaggagesInKilos.push(Number(KGs));

        segmentsBookingCodes[segment.id] = {
          bookingCode: seg['Class'][0]
        };

        transformedResult.codeShare[`${seg['AirV'][0]}${seg['FltNum'][0]}`] = {
          marketingCarrier: seg['AirV'][0],
          operatingCarrier: seg['AirV'][0],
          aircraftType: seg['EquipType']
        };
        transformedResult.segments[segment.id] = segment;
      }
      const Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;

      const itinerary = buildItineraryFromLegs(Legs);
      const encodedDeepLink = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: deeplink
      });

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: encodedDeepLink,
          price: {
            amount: price,
            currency: currency
          },
          meta: {
            baggage: {
              totalBaggages: Math.max(...totalBaggages) || undefined,
              BaggagesInKilos: Math.max(...BaggagesInKilos) || undefined
            },
            segments: segmentsBookingCodes
          }
        }
      ];
      transformedResult.itineraries[itinerary.id] = itinerary;
    } else {
      const outBoundSeg = [];
      const inBoundSeg = [];
      for (const seg of segsData) {
        if (seg['isReturn'][0] == 'false') {
          outBoundSeg.push(seg);
        }
        if (seg['isReturn'][0] == 'true') {
          inBoundSeg.push(seg);
        }
      }
      outBoundSeg.forEach((seg) => {
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: seg['From'][0],
          destination: seg['To'][0],
          departure: moment
            .utc(
              `${seg['DepartDate'][0]}${seg['DepartTime'][0]}`,
              'DD/MM/YYYY HH:mm'
            )
            .format('YYYYMMDDHHmm'),

          arrival: moment
            .utc(
              `${seg['ArrivalDate'][0]}${seg['ArrivalTime'][0]}`,
              'DD/MM/YYYY HH:mm'
            )
            .format('YYYYMMDDHHmm'),
          operatingCarrier: seg['AirV'][0],
          marketingCarrier: seg['AirV'][0],
          marketingFlightNumber: seg['FltNum'][0],
          vehicleType: 'FLIGHT'
        };
        let KGs, PCs;
        !seg.BaggageInfo
          ? 0
          : seg.BaggageInfo[0].split(' ')[1] === 'KG'
          ? (KGs = seg.BaggageInfo[0].split(' ')[0])
          : (PCs = seg.BaggageInfo[0].split(' ')[0]);

        const segment = buildSegment(transFormedSegment);

        Segments.push(segment);
        totalBaggages.push(Number(PCs));
        BaggagesInKilos.push(Number(KGs));

        segmentsBookingCodes[segment.id] = {
          bookingCode: seg['Class'][0]
        };

        transformedResult.codeShare[`${seg['AirV'][0]}${seg['FltNum'][0]}`] = {
          marketingCarrier: seg['AirV'][0],
          operatingCarrier: seg['AirV'][0],
          aircraftType: seg['EquipType']
        };
        transformedResult.segments[segment.id] = segment;
      });

      let Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
      Segments = [];

      inBoundSeg.forEach((seg) => {
        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: seg['From'][0],
          destination: seg['To'][0],

          departure: moment
            .utc(
              `${seg['DepartDate'][0]}${seg['DepartTime'][0]}`,
              'DD/MM/YYYY HH:mm'
            )
            .format('YYYYMMDDHHmm'),
          arrival: moment
            .utc(
              `${seg['ArrivalDate'][0]}${seg['ArrivalTime'][0]}`,
              'DD/MM/YYYY HH:mm'
            )
            .format('YYYYMMDDHHmm'),
          operatingCarrier: seg['AirV'][0],
          marketingCarrier: seg['AirV'][0],
          marketingFlightNumber: seg['FltNum'][0],
          vehicleType: 'FLIGHT'
        };
        let KGs, PCs;
        !seg.BaggageInfo
          ? 0
          : seg.BaggageInfo[0].split(' ')[1] === 'KG'
          ? (KGs = seg.BaggageInfo[0].split(' ')[0])
          : (PCs = seg.BaggageInfo[0].split(' ')[0]);

        const segment = buildSegment(transFormedSegment);

        Segments.push(segment);
        totalBaggages.push(Number(PCs));
        BaggagesInKilos.push(Number(KGs));

        segmentsBookingCodes[segment.id] = {
          bookingCode: seg['Class'][0]
        };

        transformedResult.codeShare[`${seg['AirV'][0]}${seg['FltNum'][0]}`] = {
          marketingCarrier: seg['AirV'][0],
          operatingCarrier: seg['AirV'][0],
          aircraftType: seg['EquipType']
        };
        transformedResult.segments[segment.id] = segment;
      });

      Leg = buildLegFromSegments(Segments);
      Legs.push(Leg);
      transformedResult.legs[Leg.id] = Leg;
      Segments = [];

      const itinerary = buildItineraryFromLegs(Legs);
      const encodedDeepLink = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: deeplink
      });

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: encodedDeepLink,
          price: {
            amount: price,
            currency: currency
          },
          meta: {
            baggage: {
              totalBaggages: Math.max(...totalBaggages) || undefined,
              BaggagesInKilos: Math.max(...BaggagesInKilos) || undefined
            },
            segments: segmentsBookingCodes
          }
        }
      ];
      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  }

  return transformedResult;
};

export default transformResults;
