import {
  findRestaurantByProfileId,
  createRestaurant,
} from "./restaurants.repository.js";
import type { RestaurantProfile } from "./restaurants.types.js";
import type { CreateRestaurantInput } from "@resqplate/shared";

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
