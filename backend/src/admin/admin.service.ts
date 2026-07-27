import {
  findRestaurantProfiles,
  findRestaurantProfileById,
  updateRestaurantVerification,
} from "./admin.repository.js";
import type {
  AdminRestaurantProfile,
  VerificationStatus,
} from "./admin.types.js";
import type { AdminVerificationActionInput } from "@resqplate/shared";
import { safeSyncRestaurantListingsToAlgolia } from "../external-services/algolia/algolia.service.js";

export async function getRestaurantProfiles(
  status?: VerificationStatus,
): Promise<AdminRestaurantProfile[]> {
  return findRestaurantProfiles(status);
}

export async function getRestaurantProfile(
  restaurantId: string,
): Promise<AdminRestaurantProfile | undefined> {
  return findRestaurantProfileById(restaurantId);
}

async function updateRestaurantStatus(
  restaurantId: string,
  status: VerificationStatus,
  input: AdminVerificationActionInput,
): Promise<AdminRestaurantProfile> {
  const exist = await findRestaurantProfileById(restaurantId);

  if (!exist) {
    throw new Error("Restaurant profile not found");
  }

  const restaurant = await updateRestaurantVerification(restaurantId, {
    verificationStatus: status,
    adminNotes: input.adminNotes ?? null,
    verifiedAt: status === "APPROVED" ? new Date() : null,
  });

  if (!restaurant) {
    throw new Error("Failed to update restaurant verification status");
  }

  await safeSyncRestaurantListingsToAlgolia(restaurant.id);

  return restaurant;
}

export async function approveRestaurant(
  restaurantId: string,
  input: AdminVerificationActionInput,
): Promise<AdminRestaurantProfile> {
  return updateRestaurantStatus(restaurantId, "APPROVED", input);
}

export async function rejectRestaurant(
  restaurantId: string,
  input: AdminVerificationActionInput,
): Promise<AdminRestaurantProfile> {
  return updateRestaurantStatus(restaurantId, "REJECTED", input);
}

export async function requestRestaurantInfo(
  restaurantId: string,
  input: AdminVerificationActionInput,
): Promise<AdminRestaurantProfile> {
  return updateRestaurantStatus(restaurantId, "INFO_REQUESTED", input);
}

export async function suspendRestaurant(
  restaurantId: string,
  input: AdminVerificationActionInput,
): Promise<AdminRestaurantProfile> {
  return updateRestaurantStatus(restaurantId, "SUSPENDED", input);
}
