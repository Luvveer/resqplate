import { algoliasearch } from "algoliasearch";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  allergensTable,
  foodListingsTable,
  listingAllergensTable,
  restaurantProfilesTable,
} from "../../db/schema.js";

function envVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

const applicationId = envVariable("ALGOLIA_APP_ID");
const writeApikey = envVariable("ALGOLIA_WRITE_API_KEY");
const indexName = envVariable("ALGOLIA_LISTINGS_INDEX");
const algoliaClient = algoliasearch(applicationId, writeApikey);

export type AlgoliaFoodListingRecord = {
  objectID: string;
  title: string;
  description: string;
  category: string;
  restaurantId: string;
  restaurantName: string;
  city: string;
  province: string;
  allergenIds: string[];
  allergenNames: string[];
  quantityAvailable: number;
  status: "AVAILABLE" | "RESERVED" | "EXPIRED";
  pickupEndTimestamp: number;
};

async function buildListingRecord(
  listingId: string,
): Promise<AlgoliaFoodListingRecord | null> {
  const [row] = await db
    .select({
      listing: foodListingsTable,
      restaurant: restaurantProfilesTable,
    })
    .from(foodListingsTable)
    .innerJoin(
      restaurantProfilesTable,
      eq(foodListingsTable.restaurantId, restaurantProfilesTable.id),
    )
    .where(eq(foodListingsTable.id, listingId));

  if (!row) {
    return null;
  }

  const { listing, restaurant } = row;

  const searchable =
    listing.status === "AVAILABLE" &&
    listing.quantityAvailable > 0 &&
    listing.pickupEnd.getTime() > Date.now() &&
    restaurant.verificationStatus === "APPROVED";

  if (!searchable) {
    return null;
  }

  const allergens = await db
    .select({
      id: allergensTable.id,
      name: allergensTable.name,
    })
    .from(listingAllergensTable)
    .innerJoin(
      allergensTable,
      eq(listingAllergensTable.allergenId, allergensTable.id),
    )
    .where(eq(listingAllergensTable.listingId, listingId));

  return {
    objectID: listing.id,
    title: listing.title,
    description: listing.description ?? "",
    category: listing.category ?? "",
    restaurantId: restaurant.id,
    restaurantName: restaurant.businessName,
    city: restaurant.city,
    province: restaurant.province,
    allergenIds: allergens.map((allergen) => allergen.id),
    allergenNames: allergens.map((allergen) => allergen.name),
    quantityAvailable: listing.quantityAvailable,
    status: listing.status,
    pickupEndTimestamp: Math.floor(listing.pickupEnd.getTime() / 1000),
  };
}

export async function removeListingFromAlgolia(
  listingId: string,
): Promise<void> {
  await algoliaClient.deleteObject({
    indexName,
    objectID: listingId,
  });
}

export async function syncListingToAlgolia(listingId: string): Promise<void> {
  const record = await buildListingRecord(listingId);
  if (!record) {
    await removeListingFromAlgolia(listingId);
    return;
  }

  await algoliaClient.saveObject({
    indexName,
    body: record,
  });
}

export async function safeSyncingToAlgolia(listingId: string): Promise<void> {
  try {
    await syncListingToAlgolia(listingId);
  } catch (error) {
    console.error(`failed to sync listing ${listingId} with algolia`, error);
  }
}

export async function safeRemoveListingFromAlgolia(
  listingId: string,
): Promise<void> {
  try {
    await removeListingFromAlgolia(listingId);
  } catch (error) {
    console.error(`failed to remove listing ${listingId} from algolia`, error);
  }
}

export async function configureAlgoliaListingIndex(): Promise<void> {
  const { taskID } = await algoliaClient.setSettings({
    indexName,
    indexSettings: {
      searchableAttributes: [
        "title",
        "restaurantName",
        "category",
        "description",
        "allergenNames",
        "city",
        "province",
      ],

      attributesForFaceting: [
        "filterOnly(status)",
        "filterOnly(restaurantId)",
        "filterOnly(quantityAvailable)",
        "filterOnly(pickupEndTimestamp)",
        "category",
        "city",
        "province",
        "allergenIds",
      ],

      customRanking: ["asc(pickupEndTimestamp)", "desc(quantityAvailable)"],

      attributesToRetrieve: ["objectID"],
    },
  });

  await algoliaClient.waitForTask({
    indexName,
    taskID,
  });
}

export async function reindexAllListings(): Promise<void> {
  const listings = await db
    .select({
      id: foodListingsTable.id,
    })
    .from(foodListingsTable);

  const records: AlgoliaFoodListingRecord[] = [];

  for (const listing of listings) {
    const record = await buildListingRecord(listing.id);
    if (record) {
      records.push(record);
    }
  }

  await algoliaClient.replaceAllObjects({
    indexName,
    objects: records,
  });
}

export async function safeSyncRestaurantListingsToAlgolia(
  restaurantId: string,
): Promise<void> {
  try {
    const listings = await db
      .select({
        id: foodListingsTable.id,
      })
      .from(foodListingsTable)
      .where(eq(foodListingsTable.restaurantId, restaurantId));

    for (const listing of listings) {
      await safeSyncingToAlgolia(listing.id);
    }
  } catch (error) {
    console.error("Failed to load listing for resturant for Algolia", error);
  }
}
