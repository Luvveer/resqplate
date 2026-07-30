import assert from "node:assert/strict";
import { beforeEach, describe, it, mock } from "node:test";
import type { Request, Response } from "express";
import type { Allergen } from "../../restaurants/restaurants.types.js";
import type { PublicListing } from "../listings.types.js";
import type { BrowseListingsQuery } from "@resqplate/shared";

const listingId = "bbee02eb-20fb-480a-bbe1-05552121f436";
const allergenPeanut: Allergen = {
  id: "74090ef7-dfa8-48e4-91d5-62b1c356f16e",
  name: "Peanut",
};

function makeListing(overrides: Partial<PublicListing> = {}): PublicListing {
  const now = new Date("2026-07-25T12:00:00Z");
  return {
    id: listingId,
    restaurantId: "e5e92bdf-7395-4d1a-999b-c97dd20f65b0",
    title: "Bagels",
    description: null,
    imagePath: null,
    category: null,
    quantityAvailable: 3,
    pickupStart: new Date("2026-07-26T10:00:00Z"),
    pickupEnd: new Date("2026-07-26T12:00:00Z"),
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

type ResponseState = {
  statusCode: number | undefined;
  body: unknown;
};

function makeResponse(): { response: Response; state: ResponseState } {
  const state: ResponseState = { statusCode: undefined, body: undefined };
  const response = {
    status(code: number) {
      state.statusCode = code;
      return response;
    },
    json(body: unknown) {
      state.body = body;
      return response;
    },
  } as Response;

  return { response, state };
}

function makeRequest(
  overrides: { query?: unknown; params?: Record<string, string> } = {},
): Request {
  return {
    query: overrides.query ?? {},
    params: overrides.params ?? {},
  } as Request;
}

// Check to see if this is a zod error
function isZodError(error: unknown): boolean {
  return (
    error instanceof Error &&
    Array.isArray((error as { issues?: unknown }).issues)
  );
}

let listingsResult: PublicListing[] = [];
let publicListingResult: PublicListing | undefined;
let allergensResult: Allergen[] = [];

const browseListingsMock = mock.fn(
  async (_query: BrowseListingsQuery): Promise<PublicListing[]> =>
    listingsResult,
);

const getPublicListingMock = mock.fn(
  async (_listingId: string): Promise<PublicListing | undefined> =>
    publicListingResult,
);

const getAllAllergensMock = mock.fn(
  async (): Promise<Allergen[]> => allergensResult,
);

mock.module("../listings.service.js", {
  namedExports: {
    browseListings: browseListingsMock,
    getPublicListing: getPublicListingMock,
    getAllAllergens: getAllAllergensMock,
  },
});

const {
  browseListingsHandler,
  getPublicListingHandler,
  getAllAllergensHandler,
} = await import("../listings.handler.js");

beforeEach(() => {
  listingsResult = [];
  publicListingResult = undefined;
  allergensResult = [];

  for (const mockedFunction of [
    browseListingsMock,
    getPublicListingMock,
    getAllAllergensMock,
  ]) {
    mockedFunction.mock.resetCalls();
  }
});

describe("listings handlers", () => {
  describe("browseListingsHandler", () => {
    it("responds 200 with the listings from the service", async () => {
      listingsResult = [makeListing()];
      const { response, state } = makeResponse();
      await browseListingsHandler(makeRequest(), response);
      assert.equal(state.statusCode, 200);
      assert.deepEqual(state.body, { listings: listingsResult });
      assert.equal(browseListingsMock.mock.callCount(), 1);
    });

    it("parses and reads the query before calling the service", async () => {
      const { response } = makeResponse();
      await browseListingsHandler(
        makeRequest({
          query: { city: "Burnaby", sort: "distance", lat: "49", lng: "-123" },
        }),
        response,
      );

      //check the lat and the lng
      assert.deepEqual(browseListingsMock.mock.calls[0]?.arguments[0], {
        city: "Burnaby",
        sort: "distance",
        lat: 49,
        lng: -123,
        excludeAllergenIds: [],
      });
    });

    it("rejects when there is only one lat or the lng provided", async () => {
      const { response } = makeResponse();
      //you will need the lat and the lng to sort by distance
      await assert.rejects(
        () =>
          browseListingsHandler(
            makeRequest({ query: { lat: "49" } }),
            response,
          ),
        isZodError,
      );
    });
  });

  describe("getPublicListingHandler", () => {
    it("responds 200 with the listing when found", async () => {
      publicListingResult = makeListing();
      const { response, state } = makeResponse();

      await getPublicListingHandler(
        makeRequest({ params: { listingId } }),
        response,
      );
      assert.equal(state.statusCode, 200);
      assert.deepEqual(state.body, { listing: publicListingResult });
      assert.equal(getPublicListingMock.mock.calls[0]?.arguments[0], listingId);
    });

    it("responds 404 when the listing is not found", async () => {
      publicListingResult = undefined;
      const { response, state } = makeResponse();
      await getPublicListingHandler(
        makeRequest({ params: { listingId } }),
        response,
      );

      assert.equal(state.statusCode, 404);
      assert.equal(typeof (state.body as { error?: unknown }).error, "string");
    });

    it("rejects an invalid listingId with a ZodError", async () => {
      const { response } = makeResponse();

      await assert.rejects(
        () =>
          getPublicListingHandler(
            makeRequest({ params: { listingId: "not-a-uuid" } }),
            response,
          ),
        isZodError,
      );
      assert.equal(getPublicListingMock.mock.callCount(), 0);
    });
  });

  describe("getAllAllergensHandler", () => {
    it("responds 200 with the allergen list", async () => {
      allergensResult = [allergenPeanut];
      const { response, state } = makeResponse();
      await getAllAllergensHandler(makeRequest(), response);
      assert.equal(state.statusCode, 200);
      assert.deepEqual(state.body, { allergens: [allergenPeanut] });
      assert.equal(getAllAllergensMock.mock.callCount(), 1);
    });
  });
});
