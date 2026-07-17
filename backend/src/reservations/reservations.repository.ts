import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { foodListingsTable, reservationTable } from "../db/schema.js";
import type { FoodListing } from "../restaurants/restaurants.types.js";
import type {
  Reservation,
  ReservationWithListing,
} from "./reservations.types.js";

// Get the reservations for a given profileId, along with the associated listing details
export async function findReservationById(
  reservationId: string,
): Promise<Reservation | undefined> {
  const [reservation] = await db
    .select()
    .from(reservationTable)
    .where(eq(reservationTable.id, reservationId));
  return reservation;
}

// Filter the call by only one seeker, mainly the newest frist
export async function findReservationsWithListingByProfileId(
  profileId: string,
): Promise<ReservationWithListing[]> {
  const rows = await db
    .select({
      reservation: reservationTable,
      listing: foodListingsTable,
    })
    .from(reservationTable)
    .leftJoin(
      foodListingsTable,
      eq(reservationTable.listingId, foodListingsTable.id),
    )
    .where(eq(reservationTable.profileId, profileId))
    .orderBy(desc(reservationTable.reservedAt));

  return rows.map((row) => ({ ...row.reservation, listing: row.listing }));
}

// Guard so that the same seeker cannot reserve the same listing twice, and that the listing is still available
export async function findActiveReservationForListing(
  profileId: string,
  listingId: string,
): Promise<Reservation | undefined> {
  const [reservation] = await db
    .select()
    .from(reservationTable)
    .where(
      and(
        eq(reservationTable.profileId, profileId),
        eq(reservationTable.listingId, listingId),
        eq(reservationTable.status, "RESERVED"),
      ),
    );
  return reservation;
}

// automaticlly makes sure that the listing is locked so that no 2 poeple at the same moment can reserve the same listing, and that the listing is still available
export async function reserveListingAtomically(input: {
  profileId: string;
  listingId: string;
  pickupCodeDisplay: string;
  pickupSlotStart: Date;
  pickupSlotEnd: Date;
}): Promise<{ reservation: Reservation; listing: FoodListing }> {
  return db.transaction(async (tx) => {
    //Check if the listing is still available
    const [listing] = await tx
      .select()
      .from(foodListingsTable)
      .where(eq(foodListingsTable.id, input.listingId))
      .for("update"); // Lock the row for update

    if (!listing) {
      throw new Error("The listing does not exist");
    }

    if (listing.status !== "AVAILABLE") {
      throw new Error("Sorry!! This listing is no longer available");
    }
    if (listing.quantityAvailable < 1) {
      throw new Error("Sorry!! This listing is sold out");
    }

    // Decrease the reservation quantity by 1
    const remaining = listing.quantityAvailable - 1;
    const nextStatus = remaining === 0 ? "RESERVED" : "AVAILABLE";

    const [updatedListing] = await tx
      .update(foodListingsTable)
      .set({
        quantityAvailable: remaining,
        status: nextStatus,
        updatedAt: new Date(),
      })
      .where(eq(foodListingsTable.id, input.listingId))
      .returning();

    if (!updatedListing) {
      throw new Error("Failed to update the listing during this reservation");
    }

    // Create the reservation with the seaker's code
    const [reservation] = await tx
      .insert(reservationTable)
      .values({
        profileId: input.profileId,
        listingId: input.listingId,
        pickupCodeDisplay: input.pickupCodeDisplay,
        status: "RESERVED",
        pickupSlotStart: input.pickupSlotStart,
        pickupSlotEnd: input.pickupSlotEnd,
      })
      .returning();

    if (!reservation) {
      throw new Error("Failed to create the reservation");
    }

    return { reservation, listing: updatedListing };
  });
}

//Automatically cancel the reservation and update the listing's quantity and status
export async function cancelReservationAtomically(
  reservationId: string,
  listingId: string,
): Promise<Reservation> {
  return db.transaction(async (tx) => {
    // Find the reservation and lock it for update
    const [listing] = await tx
      .select()
      .from(foodListingsTable)
      .where(eq(foodListingsTable.id, listingId))
      .for("update");

    //check to restock only if the listing is still available
    if (listing) {
      const restored = listing.quantityAvailable + 1;

      //do not touch the expired listings
      const nextStatus =
        listing.status === "RESERVED" ? "AVAILABLE" : listing.status;

      await tx
        .update(foodListingsTable)
        .set({
          quantityAvailable: restored,
          status: nextStatus,
          updatedAt: new Date(),
        })
        .where(eq(foodListingsTable.id, listingId));
    }

    const [reservation] = await tx
      .update(reservationTable)
      .set({
        status: "CANCELLED",
        cancelledAt: new Date(),
      })
      .where(eq(reservationTable.id, reservationId))
      .returning();

    if (!reservation) {
      throw new Error(
        "Sorry!! Failed to cancel the reservation. Please try again.",
      );
    }

    return reservation;
  });
}
