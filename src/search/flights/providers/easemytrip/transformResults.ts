import {
  buildSegment,
  buildLegFromSegments,
  buildItineraryFromLegs,
  encodeRedirectPayload
} from '../../../../utils';

import moment from 'moment';

const providerName = 'easemytrip';

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
  if (
    Object.keys(data).length === 0 ||
    data.Journeys.length == 0 ||
    !data.Journeys
  ) {
    transformedResult['error'] = 'No data found';
    return transformedResult;
  }

  transformedResult.agents[agent.id] = agent;

  if (options.tripType === 'oneway') {
    for (const seg of data.Journeys[0].Segments) {
      const Segments: TransformedSegment[] = [];
      const Legs: TransformedLeg[] = [];
      for (const outbound_journey of seg.Bonds[0].Legs) {
        const {
          Origin,
          Destination,
          DepartureTime,
          DepartureDate,
          ArrivalTime,
          ArrivalDate,
          AircraftType,
          FlightNumber,
          CarrierCode
        } = outbound_journey;

        const getFormattedDateTime = (
          dateString: string,
          timeString: string
        ): string => {
          const timeFormat = 'HH:mm';
          const dateFormat = 'ddd-DDMMMYYYY';
          const finalFormat = 'YYYYMMDDHHmm';
          const dateMoment = moment(dateString, dateFormat);
          const timeMoment = moment(timeString, timeFormat);
          const combinedMoment = moment({
            year: dateMoment.year(),
            month: dateMoment.month(),
            date: dateMoment.date(),
            hour: timeMoment.hour(),
            minute: timeMoment.minute()
          });
          return combinedMoment.format(finalFormat);
        };

        const formattedDepartureDateTime = getFormattedDateTime(
          DepartureDate,
          DepartureTime
        );
        const formattedArrivalDateTime = getFormattedDateTime(
          ArrivalDate,
          ArrivalTime
        );

        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: Origin,
          destination: Destination,
          departure: formattedDepartureDateTime,
          arrival: formattedArrivalDateTime,
          marketingCarrier: CarrierCode,
          operatingCarrier: CarrierCode,
          marketingFlightNumber: FlightNumber,
          vehicleType: 'FLIGHT'
        };
        transformedResult.codeShare[`${CarrierCode}${FlightNumber}`] = {
          marketingCarrier: CarrierCode,
          operatingCarrier: CarrierCode,
          aircraftType: AircraftType
        };
        const segment = buildSegment(transFormedSegment);

        Segments.push(segment);

        transformedResult.segments[segment.id] = segment;
      }

      const Leg = buildLegFromSegments(Segments);

      Legs.push(Leg);

      transformedResult.legs[Leg.id] = Leg;

      const itinerary = buildItineraryFromLegs(Legs);
      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: seg.Deeplink
      });

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkPayload,
          price: {
            amount:
              seg.Fare.TotalFareWithOutMarkUp + seg.Fare.TotalTaxWithOutMarkUp,
            currency: seg.CurrencyCode
          },
          meta: {
            restrictions: {
              refundable: seg.Fare.PaxFares[0].Refundable
            }
          }
        }
      ];
      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  } else {
    for (const seg of data.Journeys[0].Segments) {
      const outSegments: TransformedSegment[] = [];
      const Legs: TransformedLeg[] = [];
      for (const outbound_journey of seg.Bonds[0].Legs) {
        const {
          Origin,
          Destination,
          DepartureTime,
          DepartureDate,
          ArrivalTime,
          ArrivalDate,
          AircraftType,
          FlightNumber,
          CarrierCode
        } = outbound_journey;

        const getFormattedDateTime = (
          dateString: string,
          timeString: string
        ): string => {
          const timeFormat = 'HH:mm';
          const dateFormat = 'ddd-DDMMMYYYY';
          const finalFormat = 'YYYYMMDDHHmm';
          const dateMoment = moment(dateString, dateFormat);
          const timeMoment = moment(timeString, timeFormat);
          const combinedMoment = moment({
            year: dateMoment.year(),
            month: dateMoment.month(),
            date: dateMoment.date(),
            hour: timeMoment.hour(),
            minute: timeMoment.minute()
          });
          return combinedMoment.format(finalFormat);
        };

        const formattedDepartureDateTime = getFormattedDateTime(
          DepartureDate,
          DepartureTime
        );
        const formattedArrivalDateTime = getFormattedDateTime(
          ArrivalDate,
          ArrivalTime
        );

        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: Origin,
          destination: Destination,
          departure: formattedDepartureDateTime,
          arrival: formattedArrivalDateTime,
          marketingCarrier: CarrierCode,
          operatingCarrier: CarrierCode,
          marketingFlightNumber: FlightNumber,
          vehicleType: 'FLIGHT'
        };
        transformedResult.codeShare[`${CarrierCode}${FlightNumber}`] = {
          marketingCarrier: CarrierCode,
          operatingCarrier: CarrierCode,
          aircraftType: AircraftType
        };
        const segment = buildSegment(transFormedSegment);

        outSegments.push(segment);

        transformedResult.segments[segment.id] = segment;
      }

      let Leg = buildLegFromSegments(outSegments);

      Legs.push(Leg);

      transformedResult.legs[Leg.id] = Leg;

      const InSegments: TransformedSegment[] = [];
      for (const inbound_journey of seg.Bonds[1].Legs) {
        const {
          Origin,
          Destination,
          DepartureTime,
          DepartureDate,
          ArrivalTime,
          ArrivalDate,
          AircraftType,
          FlightNumber,
          CarrierCode
        } = inbound_journey;

        const getFormattedDateTime = (
          dateString: string,
          timeString: string
        ): string => {
          const timeFormat = 'HH:mm';
          const dateFormat = 'ddd-DDMMMYYYY';
          const finalFormat = 'YYYYMMDDHHmm';
          const dateMoment = moment(dateString, dateFormat);
          const timeMoment = moment(timeString, timeFormat);
          const combinedMoment = moment({
            year: dateMoment.year(),
            month: dateMoment.month(),
            date: dateMoment.date(),
            hour: timeMoment.hour(),
            minute: timeMoment.minute()
          });
          return combinedMoment.format(finalFormat);
        };

        const formattedDepartureDateTime = getFormattedDateTime(
          DepartureDate,
          DepartureTime
        );
        const formattedArrivalDateTime = getFormattedDateTime(
          ArrivalDate,
          ArrivalTime
        );

        const transFormedSegment: TransformedSegmentWithoutID = {
          origin: Origin,
          destination: Destination,
          departure: formattedDepartureDateTime,
          arrival: formattedArrivalDateTime,
          marketingCarrier: CarrierCode,
          operatingCarrier: CarrierCode,
          marketingFlightNumber: FlightNumber,
          vehicleType: 'FLIGHT'
        };
        transformedResult.codeShare[`${CarrierCode}${FlightNumber}`] = {
          marketingCarrier: CarrierCode,
          operatingCarrier: CarrierCode,
          aircraftType: AircraftType
        };
        const segment = buildSegment(transFormedSegment);

        InSegments.push(segment);

        transformedResult.segments[segment.id] = segment;
      }

      Leg = buildLegFromSegments(InSegments);

      Legs.push(Leg);

      transformedResult.legs[Leg.id] = Leg;

      const itinerary = buildItineraryFromLegs(Legs);
      const deepLinkPayload = encodeRedirectPayload({
        provider: providerName,
        agentId: agent.id,
        agentName: agent.name,
        url: seg.Deeplink
      });

      itinerary.pricingOptions = [
        {
          agent: agent.id,
          agentName: agent.name,
          deepLink: deepLinkPayload,
          price: {
            amount:
              seg.Fare.TotalFareWithOutMarkUp + seg.Fare.TotalTaxWithOutMarkUp,
            currency: seg.CurrencyCode
          },
          meta: {
            restrictions: {
              refundable: seg.Fare.PaxFares[0].Refundable
            }
          }
        }
      ];
      transformedResult.itineraries[itinerary.id] = itinerary;
    }
  }
  return transformedResult;
};
export default transformResults;
