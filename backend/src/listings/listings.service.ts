import {
  findAvailableListings,
  findPublicListingById,
  findallAllergens,
} from "./listings.repository.js";
import type { Allergen } from "../restaurants/restaurants.types.js";
import type { PublicListing } from "./listings.types.js";
import type { BrowseListingsQuery } from "@resqplate/shared";
import { haversineKm, resolveListingCoordinate, roundKm } from "./distance.js";

// Simple search of the seeker's feed
export async function browseListings(
  query: BrowseListingsQuery,
): Promise<PublicListing[]> {
  const listings = await findAvailableListings(query);
  const { lat, lng } = query;
  // If the user has provided a location, calculate the distance from each listing to that location
  if (lat === undefined || lng === undefined) {
    return listings;
  }

  // Mention the distance from the listing to the user in the response if the user has provided a location
  const annotated: PublicListing[] = listings.map((listing) => {
    const point = resolveListingCoordinate(listing);
    return {
      ...listing,
      distanceKm:
        point === null
          ? null
          : roundKm(haversineKm(lat, lng, point.lat, point.lng)),
    };
  });

  const radiusKm = query.radiusKm;

  // if there is no location for a listing, it should be filtered out if the user has provided a location and a radius
  const withinRadius =
    radiusKm === undefined
      ? annotated
      : annotated.filter(
          (listing) =>
            listing.distanceKm != null && listing.distanceKm <= radiusKm,
        );

  if (query.sort !== "distance") {
    return withinRadius;
  }

  // Sort the listings by distance if the user has provided a location and requested sorting by distance
  return [...withinRadius].sort((a, b) => {
    const distanceA = a.distanceKm ?? Number.POSITIVE_INFINITY;
    const distanceB = b.distanceKm ?? Number.POSITIVE_INFINITY;
    return distanceA - distanceB;
  });
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
