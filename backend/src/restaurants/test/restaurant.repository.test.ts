import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db";
import { user } from "../../db/auth-schema";
import { allergensTable, ProfileTable } from "../../db/schema";
import {
  findRestaurantByProfileId,
  createRestaurant,
  findListingByRestaurantId,
  findListingById,
  createListing,
  findListingsByRestaurantId,
  updateListingStatus,
  updateListing,
  findAllergensByIds,
  replaceListingAllergens,
  findListingAllergens,
} from "../restaurants.repository";

describe("restaurant repository", () => {
  let authId: string;
  let profileId: string;
  let restaurantId: string;
  let createdAllergenIds: string[];

  function makeListingInput(
    overrides: Partial<Parameters<typeof createListing>[0]> = {},
  ) {
    const now = Date.now();
    return {
      restaurantId,
      title: "Choclate Donuts",
      quantityAvailable: 5,
      pickupStart: new Date(now + 3600 * 1000),
      pickupEnd: new Date(now + 3600 * 3000),
      ...overrides,
    };
  }

  beforeEach(async () => {
    authId = randomUUID();

    await db.insert(user).values({
      id: authId,
      name: "Test Business Owner",
      email: `${authId}@test.local`,
      emailVerified: true,
    });

    const [profile] = await db
      .insert(ProfileTable)
      .values({
        authId,
        email: `${authId}@test.local`,
        name: "Testing busineess Owner",
        role: "BUSINESS",
      })
      .returning();

    profileId = profile.id;

    const restaurant = await createRestaurant({
      profileId,
      businessName: "Testing Bakery",
      address: "3357 Ganymede Dr",
      city: "Burnaby",
      province: "BC",
      postalCode: "V3J 1A5",
    });

    restaurantId = restaurant.id;
    createdAllergenIds = [];
  });

  afterEach(async () => {
    if (createdAllergenIds.length > 0) {
      await db
        .delete(allergensTable)
        .where(inArray(allergensTable.id, createdAllergenIds));
    }
    await db.delete(user).where(eq(user.id, authId));
  });

  it("creating a restaurant profile and checking it its Exists", async () => {
    const found = await findRestaurantByProfileId(profileId);
    assert.equal(found?.id, restaurantId);
    assert.equal(found?.profileId, profileId);
    assert.equal(found?.businessName, "Testing Bakery");
    assert.equal(found?.verificationStatus, "PENDING");
  });

  it("creating a listing and checking if it exists", async () => {
    const create = await createListing(makeListingInput());
    assert.equal(create.restaurantId, restaurantId);
    assert.equal(create.status, "AVAILABLE");

    const restaurant = await findListingsByRestaurantId(restaurantId);
    assert.equal(restaurant.length, 1);
    assert.equal(restaurant[0]?.id, create.id);

    const id = await findListingById(create.id);
    assert.equal(id?.id, create.id);

    const check = await findListingByRestaurantId(create.id, restaurantId);
    assert.equal(check?.id, create.id);
  });

  it("updating the listing status to expired", async () => {
    const create = await createListing(makeListingInput());
    const updated = await updateListingStatus(create.id, "EXPIRED");
    assert.equal(updated?.status, "EXPIRED");
  });

  it("updating the listing title to a new title", async () => {
    const create = await createListing(makeListingInput());
    const updated = await updateListing(create.id, { title: "New title" });
    assert.equal(updated?.title, "New title");
  });

  it("Testing allergen with empty and filled array", async () => {
    const result = await findAllergensByIds([]);
    assert.deepEqual(result, []);

    const [gluten, diary] = await db
      .insert(allergensTable)
      .values([
        { name: `Gluten-${randomUUID()}` },
        { name: `Diary-${randomUUID()}` },
      ])
      .returning();
    createdAllergenIds.push(gluten!.id, diary!.id);

    const found = await findAllergensByIds([gluten!.id, diary!.id]);
    assert.equal(found.length, 2);

    const listing = await createListing(makeListingInput());
    const firstReplace = await replaceListingAllergens(listing.id, [
      gluten!.id,
    ]);
    assert.equal(firstReplace.length, 1);

    let listingAllergens = await findListingAllergens(listing.id);
    assert.equal(listingAllergens.length, 1);

    const secondReplace = await replaceListingAllergens(listing.id, [
      diary!.id,
    ]);
    assert.equal(secondReplace[0]?.id, diary!.id);

    listingAllergens = await findListingAllergens(listing.id);
    assert.equal(listingAllergens.length, 1);
    assert.equal(listingAllergens[0]?.id, diary!.id);
  });
});
