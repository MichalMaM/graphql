// @flow

import type { DepartureArrival, Leg } from '../flight/Flight';
import type { Price } from '../common/types/Price';
import type { AllowedBaggage } from './Baggage';
import type { TripData } from './types/outputs/Trip';

/**
 * This is fetched from 'bookings' endpoint.
 */
export type BookingType =
  | 'BookingOneWay'
  | 'BookingReturn'
  | 'BookingMulticity';

export type BookingsItem = {
  id: number,
  arrival: DepartureArrival,
  departure: DepartureArrival,
  legs: Array<Leg>,
  price: Price,
  authToken: string,
  status: string,
  type: BookingType,
  passengerCount: number,
  trips?: TripData[],
  inbound?: TripData,
  outbound?: TripData,
  passengers: Passenger[],
};

export type TravelDocument = {|
  idNumber: string,
  expiration: number,
|};

export type Passenger = {|
  id: number,
  firstname: string,
  lastname: string,
  insuranceType: string,
  title: string,
  birthday: string,
  nationality: string,
  travelDocument: TravelDocument,
|};

export type BookedService = {|
  category: string,
  status: string,
|};

export type ContactDetails = {|
  phone: string,
  email: string,
|};

/**
 * This is additionally fetched from 'booking/12..' endpoint if needed.
 */
export type Booking = BookingsItem & {
  allowedBaggage: AllowedBaggage,
  assets: BookingAssets,
  bookedServices: BookedService[],
  contactDetails: ContactDetails,
};

export type BookingAssets = {
  ticketUrl: string,
  invoiceUrl: string,
};
