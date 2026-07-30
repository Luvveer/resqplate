import assert from "node:assert/strict";
import { beforeEach, describe, it, mock } from "node:test";
import type { Allergen } from "../../restaurants/restaurants.types.js";
import type { PublicListing, RestaurantSummary } from "../listings.types.js";
import type { BrowseListingsQuery } from "@resqplate/shared";

const ORIGIN = { lat: 49, lng: -123 };

const allergenPeanut: Allergen = {
  id: "74090ef7-dfa8-48e4-91d5-62b1c356f16e",
  name: "Peanut",
};

function makeRestaurantSummary(
  overrides: Partial<RestaurantSummary> = {},
): RestaurantSummary {
  return {
    id: "e5e92bdf-7395-4d1a-999b-c97dd20f65b0",
    businessName: "Tiffin Wala",
    address: "2086 Meadowood Park",
    city: "Burnaby",
    province: "British Columbia",
    latitude: "49.1000",
    longitude: "-123.0000",
    ...overrides,
  };
}

function makeListing(overrides: Partial<PublicListing> = {}): PublicListing {
  const now = new Date("2026-07-25T12:00:00");
  return {
    id: "listing-a",
    restaurantId: "e5e92bdf-7395-4d1a-999b-c97dd20f65b0",
    title: "Bagels",
    description: null,
    imagePath: null,
    category: null,
    quantityAvailable: 3,
    pickupStart: new Date("2026-07-26T10:00:00"),
    pickupEnd: new Date("2026-07-26T12:00:00"),
    status: "AVAILABLE",
    addressSnapShot: null,
    latitude: "49.0000",
    longitude: "-123.0000",
    storageNote: null,
    createdAt: now,
    updatedAt: now,
    allergens: [],
    restaurant: null,
    ...overrides,
  };
}

function makeQuery(
  overrides: Partial<BrowseListingsQuery> = {},
): BrowseListingsQuery {
  return { excludeAllergenIds: [], ...overrides };
}

let availableListings: PublicListing[] = [];
let publicListingResult: PublicListing | undefined;
let allergensResult: Allergen[] = [];

const findAvailableListingsMock = mock.fn(
  async (_query: BrowseListingsQuery): Promise<PublicListing[]> =>
    availableListings,
);
const findPublicListingByIdMock = mock.fn(
  async (_query: BrowseListingsQuery): Promise<PublicListing | undefined> =>
    publicListingResult,
);
const findallAllergensMock = mock.fn(
  async (): Promise<Allergen[]> => allergensResult,
);

mock.module("../listings.repository.js", {
  namedExports: {
    findAvailableListings: findAvailableListingsMock,
    findPublicListingById: findPublicListingByIdMock,
    findallAllergens: findallAllergensMock,
  },
});

const { browseListings, getPublicListing, getAllAllergens } =
  await import("../listings.service.js");

beforeEach(() => {
  availableListings = [];
  publicListingResult = undefined;
  allergensResult = [];

  for (const mockedFunction of [
    findAvailableListingsMock,
    findPublicListingByIdMock,
    findallAllergensMock,
  ]) {
    mockedFunction.mock.resetCalls();
  }
});

describe("listings service", () => {
  describe("browseListings", () => {
    it("returns listings unannotated when no location is provided", async () => {
      availableListings = [
        makeListing({ title: "listing-a" }),
        makeListing({
          title: "listing-b",
          latitude: "49.0000",
          longitude: "-123.1000",
        }),
      ];
      const result = await browseListings(makeQuery());

      //If there is no lat or lng then the feed is passed without adding any distance
      assert.deepEqual(result, availableListings);
      assert.equal(result[0].distanceKm, undefined);
      assert.equal(findAvailableListingsMock.mock.callCount(), 1);
    });

    it("forwards the parsed query to the repository", async () => {
      const query = makeQuery({
        city: "Burnaby",
        category: "Bakery",
        search: "bagel",
        excludeAllergenIds: [allergenPeanut.id],
      });
      await browseListings(query);

      assert.deepEqual(
        findAvailableListingsMock.mock.calls[0]?.arguments[0],
        query,
      );
    });

    it("annotates each listing with a rounded distance when a location is given", async () => {
      availableListings = [
        makeListing({
          id: "listing-a",
          latitude: "49.0000",
          longitude: "-123.0000",
        }),
        makeListing({
          id: "listing-b",
          latitude: "49.0000",
          longitude: "-123.1000",
        }),
      ];
      const result = await browseListings(
        makeQuery({ lat: ORIGIN.lat, lng: ORIGIN.lng }),
      );
      assert.equal(result[0]?.distanceKm, 0);
      assert.equal(result[1]?.distanceKm, 7.3);
    });

    it("falls back to the restaurant cordinates when the listing has no coordinates", async () => {
      availableListings = [
        makeListing({
          id: "listing-c",
          latitude: null,
          longitude: null,
          //So heere the restaurant sits at (49.1, -123) -> 11.1 km from the origin.
          restaurant: makeRestaurantSummary({
            latitude: "49.1000",
            longitude: "-123.0000",
          }),
        }),
      ];
      const result = await browseListings(
        makeQuery({ lat: ORIGIN.lat, lng: ORIGIN.lng }),
      );

      assert.equal(result[0]?.distanceKm, 11.1);
    });

    it("filters out listings beyond the requested radius", async () => {
      availableListings = [
        makeListing({
          id: "listing-a",
          latitude: "49.0000",
          longitude: "-123.0000",
        }), // 0 km
        makeListing({
          id: "listing-c",
          latitude: "49.1000",
          longitude: "-123.0000",
        }), // 11.1 km
        makeListing({
          id: "listing-d",
          latitude: "49.5000",
          longitude: "-123.0000",
        }), // 55.6 km
      ];
      const result = await browseListings(
        makeQuery({ lat: ORIGIN.lat, lng: ORIGIN.lng, radiusKm: 20 }),
      );

      assert.deepEqual(
        result.map((listing) => listing.id),
        ["listing-a", "listing-c"],
      );
    });

    it("drops listings with unknown distance when a radius is set", async () => {
      availableListings = [
        makeListing({
          id: "listing-a",
          latitude: "49.0000",
          longitude: "-123.0000",
        }),
        makeListing({
          id: "listing-x",
          latitude: null,
          longitude: null,
          restaurant: null,
        }),
      ];

      const result = await browseListings(
        makeQuery({ lat: ORIGIN.lat, lng: ORIGIN.lng, radiusKm: 50 }),
      );

      assert.deepEqual(
        result.map((listing) => listing.id),
        ["listing-a"],
      );
    });

    it("sorts by ascending distance when sort is 'distance'", async () => {
      availableListings = [
        makeListing({
          id: "listing-c",
          latitude: "49.1000",
          longitude: "-123.0000",
        }), // 11.1 km
        makeListing({
          id: "listing-a",
          latitude: "49.0000",
          longitude: "-123.0000",
        }), // 0 km
        makeListing({
          id: "listing-b",
          latitude: "49.0000",
          longitude: "-123.1000",
        }), // 7.3 km
      ];

      const result = await browseListings(
        makeQuery({ lat: ORIGIN.lat, lng: ORIGIN.lng, sort: "distance" }),
      );

      assert.deepEqual(
        result.map((listing) => listing.id),
        ["listing-a", "listing-b", "listing-c"],
      );
    });

    it("orders listings with unknown distance last when sorting by distance", async () => {
      availableListings = [
        makeListing({
          id: "listing-x",
          latitude: null,
          longitude: null,
          restaurant: null,
        }),
        makeListing({
          id: "listing-a",
          latitude: "49.0000",
          longitude: "-123.0000",
        }),
      ];

      const result = await browseListings(
        makeQuery({ lat: ORIGIN.lat, lng: ORIGIN.lng, sort: "distance" }),
      );

      assert.deepEqual(
        result.map((listing) => listing.id),
        ["listing-a", "listing-x"],
      );
    });

    it("preserves repository order when sort is not 'distance'", async () => {
      availableListings = [
        makeListing({
          id: "listing-c",
          latitude: "49.1000",
          longitude: "-123.0000",
        }),
        makeListing({
          id: "listing-a",
          latitude: "49.0000",
          longitude: "-123.0000",
        }),
        makeListing({
          id: "listing-b",
          latitude: "49.0000",
          longitude: "-123.1000",
        }),
      ];

      const result = await browseListings(
        makeQuery({ lat: ORIGIN.lat, lng: ORIGIN.lng }),
      );

      assert.deepEqual(
        result.map((listing) => listing.id),
        ["listing-c", "listing-a", "listing-b"],
      );
      assert.equal(result[0]?.distanceKm, 11.1);
    });
  });

  describe("getPublicListing", () => {
    it("returns the listing from the repository", async () => {
      publicListingResult = makeListing({ id: "listing-a" });
      const result = await getPublicListing("listing-a");
      assert.deepEqual(result, publicListingResult);
      assert.equal(findPublicListingByIdMock.mock.callCount(), 1);
    });

    it("returns undefined when the listing does not exist", async () => {
      publicListingResult = undefined;
      const result = await getPublicListing("missing-id");
      assert.equal(result, undefined);
    });
  });

  describe("getAllAllergens", () => {
    it("returns all allergens from the repository", async () => {
      allergensResult = [allergenPeanut];
      const result = await getAllAllergens();
      assert.deepEqual(result, allergensResult);
      assert.equal(findallAllergensMock.mock.callCount(), 1);
    });
  });
});
