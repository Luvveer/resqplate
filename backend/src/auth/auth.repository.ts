import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { ProfileTable } from "../db/schema.js";
import type { Profile, NewProfile } from "./auth.types.js";

export async function createProfile(input: NewProfile): Promise<Profile> {
  const [profile] = await db.insert(ProfileTable).values(input).returning();
  if (!profile) {
    throw new Error("Failed to create profile");
  }

  return profile;
}

export async function findProfileByAuthId(
  authId: string,
): Promise<Profile | undefined> {
  const [profile] = await db
    .select()
    .from(ProfileTable)
    .where(eq(ProfileTable.authId, authId));
  return profile;
}
