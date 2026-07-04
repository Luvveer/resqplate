import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { restaurantProfilesTable } from "../db/schema.js";
import type {
  AdminRestaurantProfile,
  UpdateRestaurantVerification,
  VerificationStatus,
} from "./admin.types.js";

export async function findRestaurantProfiles(
  status?: VerificationStatus,
): Promise<AdminRestaurantProfile[]> {
  if (status) {
    return db
      .select()
      .from(restaurantProfilesTable)
      .where(eq(restaurantProfilesTable.verificationStatus, status));
  }

  return db.select().from(restaurantProfilesTable);
}

export async function findRestaurantProfileById(
  restaurantId: string,
): Promise<AdminRestaurantProfile | undefined> {
  const [restaurant] = await db
    .select()
    .from(restaurantProfilesTable)
    .where(eq(restaurantProfilesTable.id, restaurantId));

  return restaurant;
}

export async function updateRestaurantVerification(
  restaurantId: string,
  input: UpdateRestaurantVerification,
): Promise<AdminRestaurantProfile | undefined> {
  const [restaurant] = await db
    .update(restaurantProfilesTable)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(restaurantProfilesTable.id, restaurantId))
    .returning();

  return restaurant;
}
