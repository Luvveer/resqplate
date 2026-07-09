import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { foodListingsTable, reservationTable } from "../db/schema.js";
//import type { Reservation, ReservationStatus } from "./pickups.types.js";

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
