import { randomInt } from "node:crypto";
import { findListingById } from "../restaurants/restaurants.repository.js";
import {
  findReservationById,
  findReservationsWithListingByProfileId,
  findActiveReservationForListing,
  reserveListingAtomically,
  cancelReservationAtomically,
} from "./reservations.repository.js";
import type {
  Reservation,
  ReservationWithListing,
} from "./reservations.types.js";
import { findMatchingPickupSlot } from "@resqplate/shared";
import type { CreateReservationInput } from "@resqplate/shared";
import { safeSyncingToAlgolia } from "../external-services/algolia/algolia.service.js";

// Constraint for the pickup code to be a 6 6 chars from a 31-char alphabet
const PICKUP_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const PICKUP_CODE_LENGTH = 6;

// Making a randomly generated pickup code for the seeker to use to pick up the food listing
function generatePickupCode(): string {
  let code = "";
  for (let i = 0; i < PICKUP_CODE_LENGTH; i++) {
    code += PICKUP_CODE_ALPHABET.charAt(randomInt(PICKUP_CODE_ALPHABET.length));
  }
  return code;
}

//keep one unit of a listing for the seeker otherwise throw the error
export async function createReservation(
  profileId: string,
  input: CreateReservationInput,
): Promise<Reservation | undefined> {
  // Check if the listing exists and is available
  const listing = await findListingById(input.listingId);
  if (!listing) {
    throw new Error("The listing does not exist");
  }
  if (listing.status !== "AVAILABLE") {
    throw new Error("The listing is not available for reservation");
  }

  // if the pickup has ended then dont let the user reserve the listing
  if (listing.pickupEnd.getTime() <= Date.now()) {
    throw new Error(
      "Sorry!! The listing has expired and is no longer available for reservation",
    );
  }

  //ensure that there is only one reservcation per seeker
  const existing = await findActiveReservationForListing(
    profileId,
    input.listingId,
  );
  if (existing) {
    throw new Error(
      "You have already reserved this listing currently. Please pick it up or cancel the reservation before making a new one.",
    );
  }
  const slot = findMatchingPickupSlot(
    listing.pickupStart,
    listing.pickupEnd,
    input.pickupSlotStart,
  );
  if (!slot) {
    throw new Error(
      "Sorry !! The selected pickup slot is not valid. Please select a valid pickup slot.",
    );
  }

  const pickupCodeDisplay = generatePickupCode();

  // Reserve the listing atomically
  const { reservation, listing: updatedListing } =
    await reserveListingAtomically({
      profileId,
      listingId: input.listingId,
      pickupCodeDisplay,
      pickupSlotStart: slot.start,
      pickupSlotEnd: slot.end,
    });

  await safeSyncingToAlgolia(updatedListing.id);

  return reservation;
}

// A list for all the reservations for a given seeker, along with the associated listing details
export async function getMyReservations(
  profileId: string,
): Promise<ReservationWithListing[]> {
  return findReservationsWithListingByProfileId(profileId);
}

// Cancel a reservation atomically, ensuring that the listing is updated accordingly
export async function cancelReservation(
  profileId: string,
  reservationId: string,
): Promise<Reservation | undefined> {
  // Check if the reservation exists and belongs to the profile
  const reservation = await findReservationById(reservationId);
  if (!reservation) {
    throw new Error("Reservation not found");
  }
  if (reservation.profileId !== profileId) {
    throw new Error(
      "You do not have the permission to cancel this reservation",
    );
  }

  // Cancel the reservation atomically if someone else has it
  if (reservation.status !== "RESERVED") {
    throw new Error(
      `Cannot cancel a reservation that is ${reservation.status}`,
    );
  }

  const cancelledReservation = await cancelReservationAtomically(
    reservation.id,
    reservation.listingId,
  );

  await safeSyncingToAlgolia(reservation.listingId);

  return cancelledReservation;
}
