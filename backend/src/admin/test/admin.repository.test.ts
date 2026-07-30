import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { user } from "../../db/auth-schema";
import { ProfileTable } from "../../db/schema";
import { createRestaurant } from "../../restaurants/restaurants.repository";
import {
  findRestaurantProfiles,
  findRestaurantProfileById,
  updateRestaurantVerification,
} from "../admin.repository";

describe("admin repository", () => {
  let authId: string;
  let profileId: string;
  let restaurantId: string;

  beforeEach(async () => {
    authId = randomUUID();
    await db.insert(user).values({
      id: authId,
      name: "Admin User",
      email: "resqplate123@gmail.com",
      emailVerified: true,
    });

    const [profile] = await db
      .insert(ProfileTable)
      .values({
        authId,
        email: "resqplate123@gmail.com",
        name: "Admin User",
        role: "BUSINESS",
      })
      .returning();

    profileId = profile?.id;

    const restaurant = await createRestaurant({
      profileId,
      businessName: "Testing Bakery",
      address: "3357 Ganymede Dr",
      city: "Burnaby",
      province: "BC",
      postalCode: "V3J 1A5",
    });

    restaurantId = restaurant.id;
  });

  afterEach(async () => {
    await db.delete(user).where(eq(user.id, authId));
  });

  it("find a restaurant profiles by Id", async () => {
    const found = await findRestaurantProfileById(restaurantId);
    assert.equal(found?.id, restaurantId);
    assert.equal(found?.verificationStatus, "PENDING");
  });

  it("filtering restaurant profiles by status", async () => {
    const found = await findRestaurantProfiles("PENDING");
    assert.ok(found.some((r) => r.id === restaurantId));

    const approved = await findRestaurantProfiles("APPROVED");
    assert.ok(!approved.some((r) => r.id === restaurantId));
  });

  it("fetching all restaurant profiles", async () => {
    const found = await findRestaurantProfiles();
    assert.ok(found.some((r) => r.id === restaurantId));
  });

  it("updating the verification status of a restaurant", async () => {
    const updated = await updateRestaurantVerification(restaurantId, {
      verificationStatus: "APPROVED",
      adminNotes: "Looks good",
      verifiedAt: new Date(),
    });

    assert.equal(updated?.verificationStatus, "APPROVED");
    assert.equal(updated?.adminNotes, "Looks good");
    assert.notEqual(updated?.verifiedAt, null);
  });
});
