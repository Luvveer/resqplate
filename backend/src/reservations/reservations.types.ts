// The reservation moduel's domain types

import type { FoodListing } from "../restaurants/restaurants.types.js";

export type ReservationStatus =
  | "RESERVED"
  | "PICKED_UP"
  | "CANCELLED"
  | "EXPIRED"
  | "NO_SHOW";

// The shape of the reservation response object row from the table
export interface Reservation {
  id: string;
  profileId: string;
  listingId: string;
  pickupCodeDisplay: string | null;
  status: ReservationStatus;
  reservedAt: Date;
  pickedUpAt: Date | null;
  cancelledAt: Date | null;
  noShowAt: Date | null;
  pickupSlotStart: Date;
  pickupSlotEnd: Date;
}

// Function for the new reservation request subset we give to the repo on the insert
export interface NewReservation {
  listingId: string;
  pofileId: string;
  pickupCodeDisplay: string | null | undefined;
  status?: ReservationStatus | undefined;
  pickupSlotStart: Date;
  pickupSlotEnd: Date;
}

// A extention to the reservation response object to include the listing details
export interface ReservationWithListing extends Reservation {
  listing: FoodListing | null;
}
