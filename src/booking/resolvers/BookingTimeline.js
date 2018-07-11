// @flow

import idx from 'idx';
import { DateTime } from 'luxon';

import getFlightDurationInMinutes from '../../flight/resolvers/FlightDuration';

import type {
  BookingTimelineEvent,
  BookedFlightTimelineEvent as BookedFlightType,
  BookingConfirmedTimelineEvent as BookingConfirmedType,
  PaymentConfirmedTimelineEvent as PaymentConfirmedType,
  DownloadInvoiceTimelineEvent as DownloadInvoiceType,
  DownloadETicketTimelineEvent as DownloadETicketType,
  DownloadBoardingPassTimelineEvent as DownloadBoardingPassType,
  LeaveForAirportTimelineEvent as LeaveForAirportType,
  AirportArrivalTimelineEvent as AirportArrivalType,
  BoardingTimelineEvent as BoardingType,
  DepartureTimelineEvent as DepartureType,
  ArrivalTimelineEvent as ArrivalType,
  TransportFromAirportTimelineEvent as TransportFromAirportType,
  NoMoreEditsTimelineEvent as NoMoreEditsType,
  BagDropTimelineEvent as BagDropType,
  BagPickupTimelineEvent as BagPickupType,
} from '../BookingTimeline';
import type { Booking } from '../Booking';
import type { Leg } from '../../flight/Flight';
import type { TripData } from '../types/outputs/Trip';

export default function generateEventsFrom(
  booking: Booking,
): $ReadOnlyArray<BookingTimelineEvent> {
  const numberCheckedBaggage = booking.numberCheckedBaggage || 0;

  const events = [];

  const bookedFlightEvent = generateBookedFlightEvent(booking);
  const bookingConfirmedEvent = generateBookingConfirmedEvent(booking);
  const paymentConfirmedEvent = generatePaymentConfirmedEvent(booking);
  const downloadInvoiceEvent = generateDownloadInvoiceEvent(booking);
  const downloadETicketEvent = generateDownloadETicketEvent(booking);
  const noMoreEditsEvent = generateNoMoreEditsEvent(booking);

  if (bookedFlightEvent) {
    events.push(bookedFlightEvent);
  }
  if (bookingConfirmedEvent) {
    events.push(bookingConfirmedEvent);
  }
  if (paymentConfirmedEvent) {
    events.push(paymentConfirmedEvent);
  }
  if (downloadInvoiceEvent) {
    events.push(downloadInvoiceEvent);
  }
  if (downloadETicketEvent) {
    events.push(downloadETicketEvent);
  }
  if (noMoreEditsEvent) {
    events.push(noMoreEditsEvent);
  }

  let tripEvents = [];
  switch (booking.type) {
    case 'BookingOneWay': {
      const { departure, arrival, legs } = booking;
      tripEvents = generateTripEvents(
        { departure, arrival, legs },
        numberCheckedBaggage,
      );
      break;
    }
    case 'BookingReturn': {
      const { outbound, inbound } = booking;
      tripEvents = [
        ...generateTripEvents(outbound, numberCheckedBaggage),
        ...generateTripEvents(inbound, numberCheckedBaggage),
      ];
      break;
    }
    case 'BookingMulticity': {
      const { trips } = booking;
      trips &&
        trips.forEach(trip =>
          tripEvents.push(...generateTripEvents(trip, numberCheckedBaggage)),
        );
      break;
    }
  }
  events.push(...tripEvents);

  return events;
}

function generateTripEvents(
  trip: ?TripData,
  numberCheckedBaggage: number,
): Array<any> {
  const tripEvents = [];
  if (!trip) {
    return [];
  }
  const leaveForAirportEvent = generateLeaveForAirportEvent(trip);
  if (leaveForAirportEvent) {
    tripEvents.push(leaveForAirportEvent);
  }

  const airportArrivalEvent = generateAirportArrivalEvent(trip);
  if (airportArrivalEvent) {
    tripEvents.push(airportArrivalEvent);
  }

  if (numberCheckedBaggage > 0) {
    const bagDropEvent = generateBagDropEvent(trip);
    if (bagDropEvent) {
      tripEvents.push(bagDropEvent);
    }
  }

  const { legs } = trip;
  if (legs) {
    legs.forEach((leg, index) => {
      if (index !== 0 && numberCheckedBaggage > 0 && leg.recheckRequired) {
        const bagDropEvent = generateBagDropEvent(leg);
        if (bagDropEvent) {
          tripEvents.push(bagDropEvent);
        }
      }

      const boardingEvent = generateBoardingEvent(leg);
      if (boardingEvent) {
        tripEvents.push(boardingEvent);
      }

      const downloadBoardingPassEvent = generateDownloadBoardingPassEvent(leg);
      if (downloadBoardingPassEvent) {
        tripEvents.push(downloadBoardingPassEvent);
      }

      const departureEvent = generateDepartureEvent(leg);
      if (departureEvent) {
        tripEvents.push(departureEvent);
      }

      const arrivalEvent = generateArrivalEvent(leg);
      if (arrivalEvent) {
        tripEvents.push(arrivalEvent);
      }

      if (
        index !== legs.length - 1 &&
        numberCheckedBaggage > 0 &&
        legs[index + 1].recheckRequired
      ) {
        const bagPickupEvent = generateBagPickupEvent(leg);
        if (bagPickupEvent) {
          tripEvents.push(bagPickupEvent);
        }
      }
    });
  }

  if (numberCheckedBaggage > 0) {
    const bagPickupEvent = generateBagPickupEvent(trip);
    if (bagPickupEvent) {
      tripEvents.push(bagPickupEvent);
    }
  }

  const transportFromAirportEvent = generateTransportFromAirportEvent(trip);
  if (transportFromAirportEvent) {
    tripEvents.push(transportFromAirportEvent);
  }

  return tripEvents;
}

export function generateBookedFlightEvent(booking: Booking): BookedFlightType {
  return {
    timestamp: booking.created,
    type: 'BookedFlightTimelineEvent',
    arrival: booking.arrival,
  };
}

export function generateBookingConfirmedEvent(
  booking: Booking,
): ?BookingConfirmedType {
  if (booking.status === 'confirmed') {
    return {
      timestamp: booking.created,
      type: 'BookingConfirmedTimelineEvent',
    };
  }
  return null;
}

export function generatePaymentConfirmedEvent(
  booking: Booking,
): ?PaymentConfirmedType {
  if (booking.status) {
    return {
      timestamp: booking.created,
      type: 'PaymentConfirmedTimelineEvent',
    };
  }
  return null;
}

export function generateDownloadInvoiceEvent(
  booking: Booking,
): ?DownloadInvoiceType {
  const invoiceUrl = idx(booking, _ => _.assets.invoiceUrl) || null;
  const numberPassengers = idx(booking, _ => _.passengers.length) || 0;
  return {
    timestamp: booking.created,
    type: 'DownloadInvoiceTimelineEvent',
    invoiceUrl: invoiceUrl,
    numberPassengers: numberPassengers,
    legs: booking.legs,
  };
}

export function generateDownloadETicketEvent(
  booking: Booking,
): ?DownloadETicketType {
  const ticketUrl = idx(booking.assets, _ => _.ticketUrl) || null;
  return {
    timestamp: booking.created,
    type: 'DownloadETicketTimelineEvent',
    ticketUrl: ticketUrl,
  };
}

export function generateDownloadBoardingPassEvent(
  leg: Leg,
): ?DownloadBoardingPassType {
  const localDepartureTime = idx(leg, _ => _.departure.when.local);
  if (localDepartureTime) {
    return {
      timestamp: localDepartureTime,
      type: 'DownloadBoardingPassTimelineEvent',
      leg,
    };
  }
  return null;
}

export function generateLeaveForAirportEvent(
  booking: Booking | TripData,
): ?LeaveForAirportType {
  const localDepartureTime = idx(booking.departure, _ => _.when.local);
  if (localDepartureTime) {
    const leaveForAiportTime = DateTime.fromJSDate(localDepartureTime, {
      zone: 'UTC',
    })
      .minus({
        hours: 4,
      })
      .toJSDate();
    return {
      timestamp: leaveForAiportTime,
      type: 'LeaveForAirportTimelineEvent',
    };
  }
  return null;
}

export function generateAirportArrivalEvent(
  booking: Booking | TripData,
): ?AirportArrivalType {
  const localDepartureTime = idx(booking.departure, _ => _.when.local);
  if (localDepartureTime) {
    const AiportArrivalTime = DateTime.fromJSDate(localDepartureTime, {
      zone: 'UTC',
    })
      .minus({
        hours: 2,
      })
      .toJSDate();
    return {
      timestamp: AiportArrivalTime,
      type: 'AirportArrivalTimelineEvent',
      departure: booking.departure,
    };
  }
  return null;
}

export function generateBoardingEvent(leg: Leg): ?BoardingType {
  const localDepartureTime = idx(leg, _ => _.departure.when.local);
  if (localDepartureTime) {
    const BoardingTime = DateTime.fromJSDate(localDepartureTime, {
      zone: 'UTC',
    })
      .minus({
        minutes: 30,
      })
      .toJSDate();
    return {
      timestamp: BoardingTime,
      type: 'BoardingTimelineEvent',
      gate: 'gate number', // @TODO Gate Number does not seem available for now...
    };
  }
  return null;
}

export function generateDepartureEvent(leg: Leg): ?DepartureType {
  const departureTime = idx(leg, _ => _.departure.when.local);
  const duration = getFlightDurationInMinutes(leg.departure, leg.arrival);
  const airlineCode = leg.airlineCode;
  const flightNumber = leg.flightNo;
  if (departureTime) {
    return {
      timestamp: departureTime,
      type: 'DepartureTimelineEvent',
      arrival: leg.arrival,
      duration: duration,
      airlineCode: airlineCode,
      flightNumber: flightNumber,
    };
  }
  return null;
}

export function generateArrivalEvent(leg: Leg): ?ArrivalType {
  const arrivalTime = idx(leg, _ => _.arrival.when.local);
  if (arrivalTime) {
    return {
      timestamp: arrivalTime,
      type: 'ArrivalTimelineEvent',
      arrival: leg.arrival,
    };
  }
  return null;
}

export function generateTransportFromAirportEvent(
  booking: Booking | TripData,
): ?TransportFromAirportType {
  const arrivalTime = idx(booking.arrival, _ => _.when.local);
  if (arrivalTime) {
    const transportFromAirportTime = DateTime.fromJSDate(arrivalTime, {
      zone: 'UTC',
    })
      .plus({ minutes: 15 })
      .toJSDate();
    return {
      timestamp: transportFromAirportTime,
      type: 'TransportFromAirportTimelineEvent',
    };
  }
  return null;
}

export function generateNoMoreEditsEvent(booking: Booking): ?NoMoreEditsType {
  const departureTime = idx(booking.departure, _ => _.when.local);
  const allowedToChangeFlights = idx(booking, _ => _.allowedToChangeFlights);
  if (departureTime && allowedToChangeFlights) {
    const noMoreEditsTime = DateTime.fromJSDate(departureTime, {
      zone: 'UTC',
    })
      .minus({ hours: allowedToChangeFlights })
      .toJSDate();
    return {
      timestamp: noMoreEditsTime,
      type: 'NoMoreEditsTimelineEvent',
    };
  }
  return null;
}

export function generateBagDropEvent(legOrTrip: Leg | TripData): ?BagDropType {
  const departureTime = idx(legOrTrip, _ => _.departure.when.local);
  if (departureTime) {
    const bagDropTime = DateTime.fromJSDate(departureTime, {
      zone: 'UTC',
    })
      .minus({ minutes: 35 })
      .toJSDate();
    return {
      timestamp: bagDropTime,
      type: 'BagDropTimelineEvent',
    };
  }
  return null;
}

export function generateBagPickupEvent(
  legOrTrip: Leg | TripData,
): ?BagPickupType {
  const arrivalTime = idx(legOrTrip, _ => _.arrival.when.local);
  if (arrivalTime) {
    const bagPickupTime = DateTime.fromJSDate(arrivalTime, {
      zone: 'UTC',
    })
      .plus({ minutes: 10 })
      .toJSDate();
    return {
      timestamp: bagPickupTime,
      type: 'BagPickupTimelineEvent',
    };
  }
  return null;
}
