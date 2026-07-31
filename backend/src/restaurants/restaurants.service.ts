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
  updateRestaurant,
} from "./restaurants.repository.js";
import type {
  RestaurantProfile,
  FoodListing,
  ListingWithAllergens,
  UpdateFoodListing,
  NewRestaurantProfile,
} from "./restaurants.types.js";
import type {
  CreateRestaurantInput,
  CreateListingInput,
  UpdateListingInput,
  UpdateRestrauntInput,
} from "@resqplate/shared";
import { deleteFile, saveImage } from "../filesystem/filesystem.js";
import {
  autocompleteAddress,
  resolveAddress,
} from "../external-services/places/places.service.js";
import { expireReservationForFoodListing } from "../reservations/reservations.repository.js";
import {
  safeRemoveListingFromAlgolia,
  safeSyncingToAlgolia,
} from "../external-services/algolia/algolia.service.js";

export async function getMyRestaurant(
  profileId: string,
): Promise<RestaurantProfile | undefined> {
  return findRestaurantByProfileId(profileId);
}

export async function getAddressSuggestions(
  input: string,
  sessionToken: string,
) {
  return autocompleteAddress(input, sessionToken);
}

export async function createMyRestaurant(
  profileId: string,
  input: CreateRestaurantInput,
): Promise<RestaurantProfile> {
  const existing = await findRestaurantByProfileId(profileId);
  if (existing) {
    throw new Error("Restaurant profile already exists for this account");
  }
  const { placeId, sessionToken, ...restaurantInput } = input;

  const resolvedAddress = await resolveAddress(placeId, sessionToken);

  return createRestaurant({
    ...restaurantInput,
    ...resolvedAddress,
    profileId,
  });
}

/* Feature 2 */

const MAX_PICKUP_WINDOW = 72 * 60 * 60 * 1000;

function assertPickupStarttime(pickupStart: Date) {
  if (pickupStart.getTime() < Date.now()) {
    throw new Error("Pickup start time cannot be in past");
  }
}

function assertPickupWindow(pickupStart: Date, pickupEnd: Date) {
  if (
    Number.isNaN(pickupStart.getTime()) ||
    Number.isNaN(pickupEnd.getTime())
  ) {
    throw new Error("Pickup start and end time must be valid date.");
  }
  if (pickupEnd <= pickupStart) {
    throw new Error("Pickup end time must be after pickup start time");
  }

  const pickupWindowDuration = pickupEnd.getTime() - pickupStart.getTime();

  if (pickupWindowDuration > MAX_PICKUP_WINDOW) {
    throw new Error("Pickup window cannot be longer than 72 hours.");
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

  assertPickupStarttime(listingInput.pickupStart);
  assertPickupWindow(listingInput.pickupStart, listingInput.pickupEnd);
  await validateAllergenIds(allergenIds);

  if (!restaurant.latitude || !restaurant.longitude) {
    throw new Error("Restaurant does not have valid location");
  }

  const addressSnapShot = [
    restaurant.address,
    restaurant.city,
    restaurant.province,
    restaurant.postalCode,
  ].join(", ");

  const listing = await createListing({
    ...listingInput,
    restaurantId: restaurant.id,
    addressSnapShot,
    latitude: restaurant.latitude,
    longitude: restaurant.longitude,
    status: "AVAILABLE",
  });

  if (allergenIds !== undefined) {
    await replaceListingAllergens(listing.id, allergenIds);
  }

  await safeSyncingToAlgolia(listing.id);

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

  if (listingInput.pickupStart !== undefined) {
    assertPickupStarttime(listingInput.pickupStart);
  }

  assertPickupWindow(pickupStart, pickupEnd);

  await validateAllergenIds(allergenIds);

  const updatedlisting = await updateListing(
    listingId,
    listingInput as UpdateFoodListing,
  );

  if (!updatedlisting) {
    return undefined;
  }

  if (allergenIds !== undefined) {
    await replaceListingAllergens(updatedlisting.id, allergenIds);
  }

  await safeSyncingToAlgolia(updatedlisting.id);

  return attachAllergens(updatedlisting);
}

export async function updateMyListingImage(
  profileId: string,
  listingId: string,
  file: Express.Multer.File,
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

  const newImagePath = await saveImage(file.buffer, file.mimetype, "listings");

  let updatedlisting: FoodListing | undefined;

  try {
    updatedlisting = await updateListing(listingId, {
      imagePath: newImagePath,
    });
  } catch (error) {
    await deleteFile(newImagePath).catch(() => undefined);
    throw error;
  }

  if (!updatedlisting) {
    await deleteFile(newImagePath).catch(() => undefined);
    return undefined;
  }

  if (existingListing.imagePath) {
    await deleteFile(existingListing.imagePath).catch(() => undefined);
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

  await expireReservationForFoodListing(listingId);

  await safeRemoveListingFromAlgolia(updatedlisting.id);

  return attachAllergens(updatedlisting);
}

export async function updateMyRestaurant(
  profileId: string,
  input: UpdateRestrauntInput,
): Promise<RestaurantProfile | undefined> {
  const restaurant = await findRestaurantByProfileId(profileId);
  if (!restaurant) {
    return undefined;
  }

  const { placeId, sessionToken, ...restaurantInput } = input;
  const resolvedAddress =
    placeId && sessionToken ? await resolveAddress(placeId, sessionToken) : {};

  return updateRestaurant(restaurant.id, {
    ...restaurantInput,
    ...resolvedAddress,
  } as Partial<NewRestaurantProfile>);
}
