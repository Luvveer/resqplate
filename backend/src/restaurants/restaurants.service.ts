import {
  findRestaurantByProfileId,
  createRestaurant,
  findListingsByRestaurantId,
  findListingByRestaurantId,
  createListing,
  updateListing,
  updateListingStatus,
  findAllergensByIds,
  findListingAllergens,
  replaceListingAllergens,
} from "./restaurants.repository.js";
import type {
  RestaurantProfile,
  FoodListing,
  ListingWithAllergens,
  UpdateFoodListing,
} from "./restaurants.types.js";
import type {
  CreateRestaurantInput,
  CreateListingInput,
  UpdateListingInput,
} from "@resqplate/shared";

export async function getMyRestaurant(
  profileId: string,
): Promise<RestaurantProfile | undefined> {
  return findRestaurantByProfileId(profileId);
}

export async function createMyRestaurant(
  profileId: string,
  input: CreateRestaurantInput,
): Promise<RestaurantProfile> {
  const existing = await findRestaurantByProfileId(profileId);
  if (existing) {
    throw new Error("Restaurant profile already exists for this account");
  }
  return createRestaurant({ ...input, profileId });
}

/* Feature 2 */

function assertPickupWindow(pickupStart: Date, pickupEnd: Date) {
  if (pickupEnd <= pickupStart) {
    throw new Error("Pickup end time must be after pickup start time");
  }
}

function assertRestaurantApproved(restaurant: RestaurantProfile) {
  if (restaurant.verificationStatus !== "APPROVED") {
    throw new Error(
      "Restaurant profile must be approved before managing listings",
    );
  }
}

function assertListingEditable(listing: FoodListing) {
  if (listing.status !== "AVAILABLE") {
    throw new Error("Only available listings can be update");
  }
}

async function getApprovedRestaurantForProfile(
  profileId: string,
): Promise<RestaurantProfile> {
  const restaurant = await findRestaurantByProfileId(profileId);

  if (!restaurant) {
    throw new Error("No restaurant profile found for this account");
  }

  assertRestaurantApproved(restaurant);
  return restaurant;
}

async function validateAllergenIds(allergenIds: string[] | undefined) {
  if (!allergenIds || allergenIds.length === 0) {
    return;
  }

  const allergens = await findAllergensByIds(allergenIds);

  if (allergens.length !== allergenIds.length) {
    throw new Error("One or more allergen were not found");
  }
}

async function attachAllergens(
  listing: FoodListing,
): Promise<ListingWithAllergens> {
  const allergens = await findListingAllergens(listing.id);
  return { ...listing, allergens };
}

export async function getMyListings(
  profileId: string,
): Promise<ListingWithAllergens[]> {
  const restaurant = await getApprovedRestaurantForProfile(profileId);
  const listings = await findListingsByRestaurantId(restaurant.id);

  return Promise.all(listings.map((listing) => attachAllergens(listing)));
}

export async function getMyListing(
  profileId: string,
  listingId: string,
): Promise<ListingWithAllergens | undefined> {
  const restaurant = await getApprovedRestaurantForProfile(profileId);
  const listing = await findListingByRestaurantId(listingId, restaurant.id);

  if (!listing) {
    return undefined;
  }

  return attachAllergens(listing);
}

export async function createMyListing(
  profileId: string,
  input: CreateListingInput,
): Promise<ListingWithAllergens> {
  const restaurant = await getApprovedRestaurantForProfile(profileId);
  const { allergenIds, ...listingInput } = input;

  assertPickupWindow(listingInput.pickupStart, listingInput.pickupEnd);
  await validateAllergenIds(allergenIds);

  const listing = await createListing({
    ...listingInput,
    restaurantId: restaurant.id,
    status: "AVAILABLE",
  });

  if (allergenIds) {
    await replaceListingAllergens(listing.id, allergenIds);
  }

  return attachAllergens(listing);
}

export async function updateMyListing(
  profileId: string,
  listingId: string,
  input: UpdateListingInput,
): Promise<ListingWithAllergens | undefined> {
  const restaurant = await getApprovedRestaurantForProfile(profileId);
  const existingListing = await findListingByRestaurantId(
    listingId,
    restaurant.id,
  );

  if (!existingListing) {
    return undefined;
  }

  assertListingEditable(existingListing);

  const { allergenIds, ...listingInput } = input;

  const pickupStart = listingInput.pickupStart ?? existingListing.pickupStart;
  const pickupEnd = listingInput.pickupEnd ?? existingListing.pickupEnd;
  assertPickupWindow(pickupStart, pickupEnd);

  await validateAllergenIds(allergenIds);

  const updatedlisting = await updateListing(
    listingId,
    listingInput as UpdateFoodListing,
  );

  if (!updatedlisting) {
    return undefined;
  }

  if (allergenIds) {
    await replaceListingAllergens(updatedlisting.id, allergenIds);
  }

  return attachAllergens(updatedlisting);
}

export async function expireMyListing(
  profileId: string,
  listingId: string,
): Promise<ListingWithAllergens | undefined> {
  const restaurant = await getApprovedRestaurantForProfile(profileId);
  const existingListing = await findListingByRestaurantId(
    listingId,
    restaurant.id,
  );

  if (!existingListing) {
    return undefined;
  }

  if (existingListing.status === "EXPIRED") {
    return attachAllergens(existingListing);
  }

  const updatedlisting = await updateListingStatus(listingId, "EXPIRED");

  if (!updatedlisting) {
    return undefined;
  }

  return attachAllergens(updatedlisting);
}
