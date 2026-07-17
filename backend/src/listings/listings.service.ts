import {
  findAvailableListings,
  findPublicListingById,
  findallAllergens,
} from "./listings.repository.js";
import type { Allergen } from "../restaurants/restaurants.types.js";
import type { PublicListing } from "./listings.types.js";
import type { BrowseListingsQuery } from "@resqplate/shared";

// Simple search of the seeker's feed
export async function browseListings(
  query: BrowseListingsQuery,
): Promise<PublicListing[]> {
  return findAvailableListings(query);
}

// Get the details of a specific listing for the seeker to view
export async function getPublicListing(
  listingId: string,
): Promise<PublicListing | undefined> {
  return findPublicListingById(listingId);
}

export async function getAllAllergens(): Promise<Allergen[]> {
  return findallAllergens();
}
