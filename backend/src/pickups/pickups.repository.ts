import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { foodListingsTable, reservationTable } from "../db/schema.js";
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
    .select({ reservation: reservationTable })
    .from(reservationTable)
    .innerJoin(
      foodListingsTable,
      eq(reservationTable.listingId, foodListingsTable.id),
    )
    .where(and(...conditions));

  return rows.map((row) => row.reservation);
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
