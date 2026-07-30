import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  foodListingsTable,
  ProfileTable,
  reservationTable,
} from "../db/schema.js";
import type { ReservationStatus } from "./pickups.types.js";

export async function findReservationForRestaurant(
  reservationId: string,
  restaurantId: string,
) {
  const [row] = await db
    .select({ reservation: reservationTable })
    .from(reservationTable)
    .innerJoin(
      foodListingsTable,
      eq(reservationTable.listingId, foodListingsTable.id),
    )
    .where(
      and(
        eq(reservationTable.id, reservationId),
        eq(foodListingsTable.restaurantId, restaurantId),
      ),
    );

  if (!row) {
    return undefined;
  }
  return row.reservation;
}

export async function findReservationsByRestaurant(
  restaurantId: string,
  status?: ReservationStatus,
) {
  const conditions = [eq(foodListingsTable.restaurantId, restaurantId)];
  if (status) {
    conditions.push(eq(reservationTable.status, status));
  }
  const rows = await db
    .select({ reservation: reservationTable, seekerEmail: ProfileTable.email })
    .from(reservationTable)
    .innerJoin(
      foodListingsTable,
      eq(reservationTable.listingId, foodListingsTable.id),
    )
    .innerJoin(ProfileTable, eq(ProfileTable.id, reservationTable.profileId))
    .where(and(...conditions));

  return rows.map((row) => ({
    ...row.reservation,
    seekerEmail: row.seekerEmail,
  }));
}

export async function confirmReservationPickup(reservationId: string) {
  const [updated] = await db
    .update(reservationTable)
    .set({ status: "PICKED_UP", pickedUpAt: new Date() })
    .where(
      and(
        eq(reservationTable.id, reservationId),
        eq(reservationTable.status, "RESERVED"),
      ),
    )
    .returning();

  return updated;
}

export async function markReservationNoShow(reservationId: string) {
  const [reservation] = await db
    .update(reservationTable)
    .set({ status: "NO_SHOW", noShowAt: new Date() })
    .where(
      and(
        eq(reservationTable.id, reservationId),
        eq(reservationTable.status, "RESERVED"),
      ),
    )
    .returning();

  return reservation;
}

export async function findReservationByEmail(
  resturantId: string,
  email: string,
) {
  const rows = await db
    .select({ reservation: reservationTable, seekerEmail: ProfileTable.email })
    .from(reservationTable)
    .innerJoin(
      foodListingsTable,
      eq(reservationTable.listingId, foodListingsTable.id),
    )
    .innerJoin(ProfileTable, eq(reservationTable.profileId, ProfileTable.id))
    .where(
      and(
        eq(foodListingsTable.restaurantId, resturantId),
        eq(ProfileTable.email, email),
      ),
    );
  return rows.map((row) => ({
    ...row.reservation,
    seekerEmail: row.seekerEmail,
  }));
}
