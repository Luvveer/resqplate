import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { restaurantProfilesTable } from "../db/schema.js";
import type {
  NewRestaurantProfile,
  RestaurantProfile,
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
