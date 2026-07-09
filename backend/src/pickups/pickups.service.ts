import { findRestaurantByProfileId } from "../restaurants/restaurants.repository.js";
import {
  confirmReservationPickup,
  findReservationForRestaurant,
  findReservationsByRestaurant,
} from "./pickups.repository.js";
import type { ReservationStatus } from "./pickups.types.js";

export async function getRestaurantForProfile(profileId: string) {
  const restaurant = await findRestaurantByProfileId(profileId);
  if (!restaurant) {
    throw new Error("No restaurant profile found for this account");
  }
  return restaurant;
}

export async function getMyReservations(
  profileId: string,
  status?: ReservationStatus,
) {
  const restaurant = await getRestaurantForProfile(profileId);
  const reservations = await findReservationsByRestaurant(
    restaurant.id,
    status,
  );
  return reservations;
}

export async function confirmPickup(
  profileId: string,
  reservationId: string,
  pickupCode: string,
) {
  const restaurant = await getRestaurantForProfile(profileId);
  const reservation = await findReservationForRestaurant(
    reservationId,
    restaurant.id,
  );

  if (!reservation) {
    return undefined;
  }
  if (reservation?.status !== "RESERVED") {
    throw new Error("This item is not reserved");
  }
  if (pickupCode !== reservation.pickupCodeDisplay) {
    throw new Error("Incorrect Pick up Code");
  }

  const confirmation = await confirmReservationPickup(reservationId);
  if (confirmation === undefined) {
    throw new Error("Reservation just updated, please retry");
  }

  return confirmation;
}
