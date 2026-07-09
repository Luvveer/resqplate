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
  const [reservation] = await db
    .select()
    .from(reservationTable)
    .where(eq(reservationTable.id, reservationId));
  if (reservation?.status !== "RESERVED") {
    throw new Error("already handled");
  }
  const [updated] = await db
    .update(reservationTable)
    .set({ status: "PICKED_UP", pickedUpAt: new Date() })
    .where(eq(reservationTable.id, reservationId))
    .returning();

  return updated;
}
