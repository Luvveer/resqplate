import { and, eq, gt, ilike, inArray, sql, asc } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  foodListingsTable,
  restaurantProfilesTable,
  allergensTable,
  listingAllergensTable,
} from "../db/schema.js";
import type { Allergen } from "../restaurants/restaurants.types.js";
import type { PublicListing, RestaurantSummary } from "./listings.types.js";
import type { BrowseListingsQuery } from "@resqplate/shared";

// The restaurant details that the seeks should be able to see on the listing page
const restaurantSummarySelection = {
  id: restaurantProfilesTable.id,
  businessName: restaurantProfilesTable.businessName,
  address: restaurantProfilesTable.address,
  city: restaurantProfilesTable.city,
  province: restaurantProfilesTable.province,
};

// The allergens that the seeks should be able to see on the listing page
async function getAllergensByListingIds(
  listingIds: string[],
): Promise<Map<string, Allergen[]>> {
  const map = new Map<string, Allergen[]>();
  if (listingIds.length === 0) {
    return map;
  }

  const rows = await db
    .select({
      listingId: listingAllergensTable.listingId,
      id: allergensTable.id,
      name: allergensTable.name,
    })
    .from(listingAllergensTable)
    .innerJoin(
      allergensTable,
      eq(listingAllergensTable.allergenId, allergensTable.id),
    )
    .where(inArray(listingAllergensTable.listingId, listingIds));

  for (const row of rows) {
    const list = map.get(row.listingId) ?? [];
    list.push({ id: row.id, name: row.name });
    map.set(row.listingId, list);
  }
  return map;
}

// helper for the inArray function import is correctly formated
// import { inArray } from "drizzle-orm";
// function inArrayListing(listingIds: string[]) {
//   return inArray(listingAllergensTable.listingId, listingIds);
// }

export async function findallAllergens(): Promise<Allergen[]> {
  return db
    .select({
      id: allergensTable.id,
      name: allergensTable.name,
    })
    .from(allergensTable)
    .orderBy(asc(allergensTable.name));
}

// Take a look at the avaliable listings for the seekers to browse, with the option to filter by category, search term, and allergens to exclude
export async function findAvailableListings(
  query: BrowseListingsQuery,
): Promise<PublicListing[]> {
  const now = new Date();

  // For the query build the WHERE query
  const condition = [
    eq(foodListingsTable.status, "AVAILABLE"),
    gt(foodListingsTable.quantityAvailable, 0),
    gt(foodListingsTable.pickupEnd, now),
  ];

  if (query.city) {
    condition.push(ilike(restaurantProfilesTable.city, query.city));
  }
  if (query.category) {
    condition.push(ilike(foodListingsTable.category, query.category));
  }
  if (query.search) {
    condition.push(ilike(foodListingsTable.title, `%${query.search}%`));
  }

  // We should only show the listing that does not have any of the allergens that the seeker wants to exclude
  if (query.excludeAllergenIds.length > 0) {
    condition.push(
      sql`NOT EXISTS (
                SELECT 1 FROM ${listingAllergensTable} la
                WHERE la.listing_id = ${foodListingsTable.id}
                    AND la.allergen_id IN ${query.excludeAllergenIds}
            )`,
    );
  }

  // join the listings with the restaurant details and filter by the condition
  const rows = await db
    .select({
      listing: foodListingsTable,
      restaurant: restaurantSummarySelection,
    })
    .from(foodListingsTable)
    .innerJoin(
      restaurantProfilesTable,
      eq(foodListingsTable.restaurantId, restaurantProfilesTable.id),
    )
    .where(and(...condition))
    .orderBy(foodListingsTable.pickupEnd);

  const listingIds = rows.map((row) => row.listing.id);
  const allergensByListing = await getAllergensByListingIds(listingIds);

  return rows.map((row) => ({
    ...row.listing,
    restaurant: row.restaurant as RestaurantSummary,
    allergens: allergensByListing.get(row.listing.id) ?? [],
  }));
}

//The single listing details for the seekers to view, along with the restaurant details and allergens
export async function findPublicListingById(
  listingId: string,
): Promise<PublicListing | undefined> {
  const [row] = await db
    .select({
      listing: foodListingsTable,
      restaurant: restaurantSummarySelection,
    })
    .from(foodListingsTable)
    .innerJoin(
      restaurantProfilesTable,
      eq(foodListingsTable.restaurantId, restaurantProfilesTable.id),
    )
    .where(eq(foodListingsTable.id, listingId));

  if (!row) {
    return undefined;
  }

  const allergensByListing = await getAllergensByListingIds([row.listing.id]);

  return {
    ...row.listing,
    restaurant: row.restaurant as RestaurantSummary,
    // allergens: await getAllergensByListingIds([row.listing.id]).then((map) => map.get(row.listing.id) ?? []),
    allergens: allergensByListing.get(row.listing.id) ?? [],
  };
}
