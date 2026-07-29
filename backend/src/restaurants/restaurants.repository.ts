import { and, eq, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  restaurantProfilesTable,
  allergensTable,
  foodListingsTable,
  listingAllergensTable,
} from "../db/schema.js";

import type {
  NewRestaurantProfile,
  RestaurantProfile,
  Allergen,
  FoodListing,
  ListingStatus,
  NewFoodListing,
  UpdateFoodListing,
} from "./restaurants.types.js";

export async function findRestaurantByProfileId(
  profileId: string,
): Promise<RestaurantProfile | undefined> {
  const [restaurant] = await db
    .select()
    .from(restaurantProfilesTable)
    .where(eq(restaurantProfilesTable.profileId, profileId));
  return restaurant;
}

export async function createRestaurant(
  input: NewRestaurantProfile,
): Promise<RestaurantProfile> {
  const [restaurant] = await db
    .insert(restaurantProfilesTable)
    .values(input)
    .returning();
  if (!restaurant) {
    throw new Error("Failed to create restaurant profile");
  }
  return restaurant;
}

/* Feature 2 */

export async function findListingsByRestaurantId(
  restaurantId: string,
): Promise<FoodListing[]> {
  return db
    .select()
    .from(foodListingsTable)
    .where(eq(foodListingsTable.restaurantId, restaurantId));
}

export async function findListingById(
  listingId: string,
): Promise<FoodListing | undefined> {
  const [listing] = await db
    .select()
    .from(foodListingsTable)
    .where(eq(foodListingsTable.id, listingId));

  return listing;
}

export async function findListingByRestaurantId(
  listingId: string,
  restaurantId: string,
): Promise<FoodListing | undefined> {
  const [listing] = await db
    .select()
    .from(foodListingsTable)
    .where(
      and(
        eq(foodListingsTable.id, listingId),
        eq(foodListingsTable.restaurantId, restaurantId),
      ),
    );

  return listing;
}

export async function createListing(
  input: NewFoodListing,
): Promise<FoodListing> {
  const [listing] = await db
    .insert(foodListingsTable)
    .values(input)
    .returning();

  if (!listing) {
    throw new Error("Failed to create food listing");
  }

  return listing;
}

export async function updateListing(
  listingId: string,
  input: UpdateFoodListing,
): Promise<FoodListing | undefined> {
  const [listing] = await db
    .update(foodListingsTable)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(foodListingsTable.id, listingId))
    .returning();

  return listing;
}

export async function updateListingStatus(
  listingId: string,
  status: ListingStatus,
): Promise<FoodListing | undefined> {
  const [listing] = await db
    .update(foodListingsTable)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(foodListingsTable.id, listingId))
    .returning();

  return listing;
}

export async function findAllergensByIds(
  allergenIds: string[],
): Promise<Allergen[]> {
  if (allergenIds.length === 0) {
    return [];
  }

  return db
    .select()
    .from(allergensTable)
    .where(inArray(allergensTable.id, allergenIds));
}

export async function findListingAllergens(
  listingId: string,
): Promise<Allergen[]> {
  return db
    .select({
      id: allergensTable.id,
      name: allergensTable.name,
    })
    .from(listingAllergensTable)
    .innerJoin(
      allergensTable,
      eq(listingAllergensTable.allergenId, allergensTable.id),
    )
    .where(eq(listingAllergensTable.listingId, listingId));
}

export async function replaceListingAllergens(
  listingId: string,
  allergenIds: string[],
): Promise<Allergen[]> {
  return db.transaction(async (transaction) => {
    await transaction
      .delete(listingAllergensTable)
      .where(eq(listingAllergensTable.listingId, listingId));

    if (allergenIds.length > 0) {
      await transaction.insert(listingAllergensTable).values(
        allergenIds.map((allergenId) => ({
          listingId,
          allergenId,
        })),
      );
    }

    return transaction
      .select({
        id: allergensTable.id,
        name: allergensTable.name,
      })
      .from(listingAllergensTable)
      .innerJoin(
        allergensTable,
        eq(listingAllergensTable.allergenId, allergensTable.id),
      )
      .where(eq(listingAllergensTable.listingId, listingId));
  });
}

export async function updateRestaurant(
  restaurantId: string,
  input: Partial<NewRestaurantProfile>,
): Promise<RestaurantProfile | undefined> {
  const [restaurant] = await db
    .update(restaurantProfilesTable)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(restaurantProfilesTable.id, restaurantId))
    .returning();
  return restaurant;
}
