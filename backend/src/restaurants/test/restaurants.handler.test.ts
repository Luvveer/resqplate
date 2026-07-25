import assert from "node:assert/strict";
import { beforeEach, describe, it, mock } from "node:test";
import type { Request, Response } from "express";
import type {} from "multer";
import type {
  ListingWithAllergens,
  RestaurantProfile,
} from "../restaurants.types.js";
import type {} from "../../middleware/auth.middleware.js";

const profileId = "63251816-c0b4-4df2-ba6c-d944f1258239";
const restaurantId = "e5e92bdf-7395-4d1a-999b-c97dd20f65b0";
const listingId = "bbee02eb-20fb-480a-bbe1-05552121f436";
const allergenId = "74090ef7-dfa8-48e4-91d5-62b1c356f16e";

function makeRestaurant(): RestaurantProfile {
  const now = new Date("2026-07-25T12:00:00Z");

  return {
    id: restaurantId,
    profileId,
    businessName: "Tiffin Wala",
    address: "2086 Meadowood Park",
    city: "Burnaby",
    province: "British Columbia",
    postalCode: "V5A 4G2",
    googlePlaceId: "google-place-1",
    phone: "7782843310",
    description: "Indian food",
    latitude: "49.282700",
    longitude: "-122.940000",
    verificationStatus: "APPROVED",
    adminNotes: null,
    verifiedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

function makeListing(): ListingWithAllergens {
  const now = new Date("2026-07-25T12:00:00Z");

  return {
    id: listingId,
    restaurantId,
    title: "Banana shake",
    description: "Fresh shake",
    imagePath: null,
    category: "Drink",
    quantityAvailable: 5,
    pickupStart: new Date("2026-07-26T10:00:00Z"),
    pickupEnd: new Date("2026-07-26T12:00:00Z"),
    status: "AVAILABLE",
    addressSnapShot: "2086 Meadowood Park, Burnaby, British Columbia, V5A 4G2",
    latitude: "49.282700",
    longitude: "-122.940000",
    storageNote: null,
    createdAt: now,
    updatedAt: now,
    allergens: [
      {
        id: allergenId,
        name: "Peanut",
      },
    ],
  };
}

type ResponseState = {
  statusCode: number | undefined;
  body: unknown;
};

function makeResponse(): {
  response: Response;
  state: ResponseState;
} {
  const state: ResponseState = {
    statusCode: undefined,
    body: undefined,
  };

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
  overrides: {
    authenticated?: boolean;
    body?: unknown;
    params?: Record<string, string>;
    file?: Express.Multer.File;
  } = {},
): Request {
  const request = {
    body: overrides.body ?? {},
    params: overrides.params ?? {},
  } as Request;

  if (overrides.authenticated !== false) {
    request.profile = {
      id: profileId,
      authId: "auth-user-1",
      email: "restaurant@example.com",
      name: "Restaurant Owner",
      role: "BUSINESS",
      status: "ACTIVE",
      dietaryPreferences: null,
      createdAt: new Date("2026-07-25T12:00:00Z"),
      updatedAt: new Date("2026-07-25T12:00:00Z"),
    };
  }

  if (overrides.file) {
    request.file = overrides.file;
  }

  return request;
}

let restaurantResult: RestaurantProfile | undefined;
let listingResult: ListingWithAllergens | undefined;
let listingsResult: ListingWithAllergens[];
let suggestionsResult: Array<{
  placeId: string;
  description: string;
}>;
let serviceError: unknown;

function throwServiceErrorIfPresent(): void {
  if (serviceError !== undefined) {
    throw serviceError;
  }
}

const getMyRestaurantMock = mock.fn(
  async (_profileId: string): Promise<RestaurantProfile | undefined> => {
    throwServiceErrorIfPresent();
    return restaurantResult;
  },
);

const getAddressSuggestionsMock = mock.fn(
  async (_input: string, _sessionToken: string) => {
    throwServiceErrorIfPresent();
    return suggestionsResult;
  },
);

const createMyRestaurantMock = mock.fn(
  async (
    _profileId: string,
    _input: {
      businessName: string;
      placeId: string;
      sessionToken: string;
      phone?: string;
      description?: string;
    },
  ): Promise<RestaurantProfile> => {
    throwServiceErrorIfPresent();

    if (!restaurantResult) {
      throw new Error("Missing restaurant fixture");
    }

    return restaurantResult;
  },
);

const getMyListingsMock = mock.fn(
  async (_profileId: string): Promise<ListingWithAllergens[]> => {
    throwServiceErrorIfPresent();
    return listingsResult;
  },
);

const getMyListingMock = mock.fn(
  async (
    _profileId: string,
    _listingId: string,
  ): Promise<ListingWithAllergens | undefined> => {
    throwServiceErrorIfPresent();
    return listingResult;
  },
);

const createMyListingMock = mock.fn(
  async (
    _profileId: string,
    _input: unknown,
  ): Promise<ListingWithAllergens> => {
    throwServiceErrorIfPresent();

    if (!listingResult) {
      throw new Error("Missing listing fixture");
    }

    return listingResult;
  },
);

const updateMyListingMock = mock.fn(
  async (
    _profileId: string,
    _listingId: string,
    _input: unknown,
  ): Promise<ListingWithAllergens | undefined> => {
    throwServiceErrorIfPresent();
    return listingResult;
  },
);

const updateMyListingImageMock = mock.fn(
  async (
    _profileId: string,
    _listingId: string,
    _file: Express.Multer.File,
  ): Promise<ListingWithAllergens | undefined> => {
    throwServiceErrorIfPresent();
    return listingResult;
  },
);

const expireMyListingMock = mock.fn(
  async (
    _profileId: string,
    _listingId: string,
  ): Promise<ListingWithAllergens | undefined> => {
    throwServiceErrorIfPresent();
    return listingResult;
  },
);

mock.module("../restaurants.service.js", {
  namedExports: {
    getMyRestaurant: getMyRestaurantMock,
    getAddressSuggestions: getAddressSuggestionsMock,
    createMyRestaurant: createMyRestaurantMock,
    getMyListings: getMyListingsMock,
    getMyListing: getMyListingMock,
    createMyListing: createMyListingMock,
    updateMyListing: updateMyListingMock,
    updateMyListingImage: updateMyListingImageMock,
    expireMyListing: expireMyListingMock,
  },
});

const {
  getRestaurantHandler,
  addressSuggestionsHandler,
  createRestaurantHandler,
  getMyListingsHandler,
  getMyListingHandler,
  createListingHandler,
  updateListingHandler,
  updateListingImageHandler,
  expireListingHandler,
} = await import("../restaurants.handler.js");

beforeEach(() => {
  restaurantResult = makeRestaurant();
  listingResult = makeListing();
  listingsResult = [makeListing()];
  suggestionsResult = [
    {
      placeId: "place-1",
      description: "2086 Meadowood Park, Burnaby, BC",
    },
  ];
  serviceError = undefined;

  for (const mockedFunction of [
    getMyRestaurantMock,
    getAddressSuggestionsMock,
    createMyRestaurantMock,
    getMyListingsMock,
    getMyListingMock,
    createMyListingMock,
    updateMyListingMock,
    updateMyListingImageMock,
    expireMyListingMock,
  ]) {
    mockedFunction.mock.resetCalls();
  }
});

describe("restaurant handlers", () => {
  describe("getRestaurantHandler", () => {
    it("return 401 without authenticated profile", async () => {
      const request = makeRequest({ authenticated: false });
      const { response, state } = makeResponse();

      await getRestaurantHandler(request, response);

      assert.equal(state.statusCode, 401);
      assert.deepEqual(state.body, {
        error: "Not authenticated",
      });
      assert.equal(getMyRestaurantMock.mock.callCount(), 0);
    });

    it("return 404 when restaurant does not exist", async () => {
      restaurantResult = undefined;

      const request = makeRequest();
      const { response, state } = makeResponse();

      await getRestaurantHandler(request, response);

      assert.equal(state.statusCode, 404);
      assert.deepEqual(state.body, {
        error: "No restraunt profile found",
      });
    });

    it("return authenticated restaurant", async () => {
      const request = makeRequest();
      const { response, state } = makeResponse();

      await getRestaurantHandler(request, response);

      assert.equal(state.statusCode, 200);
      assert.deepEqual(state.body, {
        restaurant: restaurantResult,
      });

      const call = getMyRestaurantMock.mock.calls[0];
      assert.ok(call);
      assert.equal(call.arguments[0], profileId);
    });
  });

  describe("addressSuggestionsHandler", () => {
    it("return 401 without authentication", async () => {
      const request = makeRequest({
        authenticated: false,
        body: {
          input: "2086 Meadow",
          sessionToken: "session-1",
        },
      });
      const { response, state } = makeResponse();

      await addressSuggestionsHandler(request, response);

      assert.equal(state.statusCode, 401);
      assert.equal(getAddressSuggestionsMock.mock.callCount(), 0);
    });

    it("return address suggestions", async () => {
      const request = makeRequest({
        body: {
          input: "2086 Meadow",
          sessionToken: "session-1",
        },
      });
      const { response, state } = makeResponse();

      await addressSuggestionsHandler(request, response);

      assert.equal(state.statusCode, 200);
      assert.deepEqual(state.body, {
        suggestions: suggestionsResult,
      });

      const call = getAddressSuggestionsMock.mock.calls[0];
      assert.ok(call);
      assert.equal(call.arguments[0], "2086 Meadow");
      assert.equal(call.arguments[1], "session-1");
    });

    it("return 400 when address lookup fails", async () => {
      serviceError = new Error("Google Places unavailable");

      const request = makeRequest({
        body: {
          input: "2086 Meadow",
          sessionToken: "session-1",
        },
      });
      const { response, state } = makeResponse();

      await addressSuggestionsHandler(request, response);

      assert.equal(state.statusCode, 400);
      assert.deepEqual(state.body, {
        error: "Google Places unavailable",
      });
    });
  });

  describe("createRestaurantHandler", () => {
    const validBody = {
      businessName: "Tiffin Wala",
      placeId: "place-1",
      sessionToken: "session-1",
      phone: "7782843310",
      description: "Indian food",
    };

    it("return 401 without authentication", async () => {
      const request = makeRequest({
        authenticated: false,
        body: validBody,
      });
      const { response, state } = makeResponse();

      await createRestaurantHandler(request, response);

      assert.equal(state.statusCode, 401);
      assert.equal(createMyRestaurantMock.mock.callCount(), 0);
    });

    it("return 201 after creating a restaurant", async () => {
      const request = makeRequest({ body: validBody });
      const { response, state } = makeResponse();

      await createRestaurantHandler(request, response);

      assert.equal(state.statusCode, 201);
      assert.deepEqual(state.body, {
        restaurant: restaurantResult,
      });
    });

    it("return 409 when restaurant creation fails", async () => {
      serviceError = new Error("Restaurant profile already exists");

      const request = makeRequest({ body: validBody });
      const { response, state } = makeResponse();

      await createRestaurantHandler(request, response);

      assert.equal(state.statusCode, 409);
      assert.deepEqual(state.body, {
        error: "Restaurant profile already exists",
      });
    });
  });

  describe("getMyListingsHandler", () => {
    it("return 401 without authentication", async () => {
      const request = makeRequest({ authenticated: false });
      const { response, state } = makeResponse();

      await getMyListingsHandler(request, response);

      assert.equal(state.statusCode, 401);
    });

    it("returns the restaurant listings", async () => {
      const request = makeRequest();
      const { response, state } = makeResponse();

      await getMyListingsHandler(request, response);

      assert.equal(state.statusCode, 200);
      assert.deepEqual(state.body, {
        listings: listingsResult,
      });
    });

    it("return 403 when listing access is rejected", async () => {
      serviceError = new Error("Restaurant profile must be approved");

      const request = makeRequest();
      const { response, state } = makeResponse();

      await getMyListingsHandler(request, response);

      assert.equal(state.statusCode, 403);
      assert.deepEqual(state.body, {
        error: "Restaurant profile must be approved",
      });
    });
  });

  describe("getMyListingHandler", () => {
    it("return 401 without authentication", async () => {
      const request = makeRequest({
        authenticated: false,
        params: { listingId },
      });
      const { response, state } = makeResponse();

      await getMyListingHandler(request, response);

      assert.equal(state.statusCode, 401);
    });

    it("return 404 when listing does not exist", async () => {
      listingResult = undefined;

      const request = makeRequest({
        params: { listingId },
      });
      const { response, state } = makeResponse();

      await getMyListingHandler(request, response);

      assert.equal(state.statusCode, 404);
      assert.deepEqual(state.body, {
        error: "Food listing not found",
      });
    });

    it("return one listing", async () => {
      const request = makeRequest({
        params: { listingId },
      });
      const { response, state } = makeResponse();

      await getMyListingHandler(request, response);

      assert.equal(state.statusCode, 200);
      assert.deepEqual(state.body, {
        listing: listingResult,
      });
    });

    it("return 403 when the service rejects access", async () => {
      serviceError = new Error("Restaurant is not approved");

      const request = makeRequest({
        params: { listingId },
      });
      const { response, state } = makeResponse();

      await getMyListingHandler(request, response);

      assert.equal(state.statusCode, 403);
      assert.deepEqual(state.body, {
        error: "Restaurant is not approved",
      });
    });
  });

  describe("createListingHandler", () => {
    const validBody = {
      title: "Banana shake",
      description: "Fresh shake",
      category: "Drink",
      quantityAvailable: 4,
      pickupStart: "2026-07-26T10:00:00Z",
      pickupEnd: "2026-07-26T12:00:00Z",
      allergenIds: [allergenId],
    };

    it("return 401 without authentication", async () => {
      const request = makeRequest({
        authenticated: false,
        body: validBody,
      });
      const { response, state } = makeResponse();

      await createListingHandler(request, response);

      assert.equal(state.statusCode, 401);
      assert.equal(createMyListingMock.mock.callCount(), 0);
    });

    it("return 201 after creating a listing", async () => {
      const request = makeRequest({ body: validBody });
      const { response, state } = makeResponse();

      await createListingHandler(request, response);

      assert.equal(state.statusCode, 201);
      assert.deepEqual(state.body, {
        listing: listingResult,
      });

      const call = createMyListingMock.mock.calls[0];
      assert.ok(call);

      const parsedInput = call.arguments[1] as {
        pickupStart: Date;
        pickupEnd: Date;
      };

      assert.ok(parsedInput.pickupStart instanceof Date);
      assert.ok(parsedInput.pickupEnd instanceof Date);
    });

    it("return 400 when listing creation fails", async () => {
      serviceError = new Error("Pickup window cannot be longer than 24 hours");

      const request = makeRequest({ body: validBody });
      const { response, state } = makeResponse();

      await createListingHandler(request, response);

      assert.equal(state.statusCode, 400);
      assert.deepEqual(state.body, {
        error: "Pickup window cannot be longer than 24 hours",
      });
    });
  });

  describe("updateListingHandler", () => {
    it("return 404 when listing does not exist", async () => {
      listingResult = undefined;

      const request = makeRequest({
        params: { listingId },
        body: {
          title: "Updated shake",
        },
      });
      const { response, state } = makeResponse();

      await updateListingHandler(request, response);

      assert.equal(state.statusCode, 404);
    });

    it("return updated listing", async () => {
      const request = makeRequest({
        params: { listingId },
        body: {
          title: "Updated shake",
        },
      });
      const { response, state } = makeResponse();

      await updateListingHandler(request, response);

      assert.equal(state.statusCode, 200);
      assert.deepEqual(state.body, {
        listing: listingResult,
      });
    });

    it("return 400 when listing update fails", async () => {
      serviceError = new Error("Only available listings can be update");

      const request = makeRequest({
        params: { listingId },
        body: {
          title: "Updated shake",
        },
      });
      const { response, state } = makeResponse();

      await updateListingHandler(request, response);

      assert.equal(state.statusCode, 400);
      assert.deepEqual(state.body, {
        error: "Only available listings can be update",
      });
    });

    it("return 401 when updating without authentication", async () => {
      const request = makeRequest({
        authenticated: false,
        params: { listingId },
        body: {
          title: "Updated shake",
        },
      });
      const { response, state } = makeResponse();

      await updateListingHandler(request, response);

      assert.equal(state.statusCode, 401);
      assert.deepEqual(state.body, {
        error: "Not authenticated",
      });
      assert.equal(updateMyListingMock.mock.callCount(), 0);
    });
  });

  describe("updateListingImageHandler", () => {
    function makeImageFile(): Express.Multer.File {
      return {
        buffer: Buffer.from("image"),
        mimetype: "image/jpeg",
        fieldname: "image",
        originalname: "food.jpg",
        encoding: "7bit",
        size: 5,
        destination: "",
        filename: "",
        path: "",
        stream: undefined as never,
      };
    }

    it("return 400 when no image is supplied", async () => {
      const request = makeRequest({
        params: { listingId },
      });
      const { response, state } = makeResponse();

      await updateListingImageHandler(request, response);

      assert.equal(state.statusCode, 400);
      assert.deepEqual(state.body, {
        error: "Please select image",
      });
      assert.equal(updateMyListingImageMock.mock.callCount(), 0);
    });

    it("return 404 when listing does not exist", async () => {
      listingResult = undefined;

      const request = makeRequest({
        params: { listingId },
        file: makeImageFile(),
      });
      const { response, state } = makeResponse();

      await updateListingImageHandler(request, response);

      assert.equal(state.statusCode, 404);
    });

    it("return listing after uploading an image", async () => {
      const request = makeRequest({
        params: { listingId },
        file: makeImageFile(),
      });
      const { response, state } = makeResponse();

      await updateListingImageHandler(request, response);

      assert.equal(state.statusCode, 200);
      assert.deepEqual(state.body, {
        listing: listingResult,
      });
    });

    it("return 400 when image update fails", async () => {
      serviceError = new Error("Image save failed");

      const request = makeRequest({
        params: { listingId },
        file: makeImageFile(),
      });
      const { response, state } = makeResponse();

      await updateListingImageHandler(request, response);

      assert.equal(state.statusCode, 400);
      assert.deepEqual(state.body, {
        error: "Image save failed",
      });
    });

    it("return 401 when uploading an image without authentication", async () => {
      const request = makeRequest({
        authenticated: false,
        params: { listingId },
      });
      const { response, state } = makeResponse();

      await updateListingImageHandler(request, response);

      assert.equal(state.statusCode, 401);
      assert.deepEqual(state.body, {
        error: "Not authenticated",
      });
      assert.equal(updateMyListingImageMock.mock.callCount(), 0);
    });
  });

  describe("expireListingHandler", () => {
    it("return 404 when listing does not exist", async () => {
      listingResult = undefined;

      const request = makeRequest({
        params: { listingId },
      });
      const { response, state } = makeResponse();

      await expireListingHandler(request, response);

      assert.equal(state.statusCode, 404);
    });

    it("return expired listing", async () => {
      listingResult = {
        ...makeListing(),
        status: "EXPIRED",
      };

      const request = makeRequest({
        params: { listingId },
      });
      const { response, state } = makeResponse();

      await expireListingHandler(request, response);

      assert.equal(state.statusCode, 200);
      assert.deepEqual(state.body, {
        listing: listingResult,
      });
    });

    it("return 400 when expiration fails", async () => {
      serviceError = new Error("Listing could not be expired");

      const request = makeRequest({
        params: { listingId },
      });
      const { response, state } = makeResponse();

      await expireListingHandler(request, response);

      assert.equal(state.statusCode, 400);
      assert.deepEqual(state.body, {
        error: "Listing could not be expired",
      });
    });

    it("return 401 when expiring without authentication", async () => {
      const request = makeRequest({
        authenticated: false,
        params: { listingId },
      });
      const { response, state } = makeResponse();

      await expireListingHandler(request, response);

      assert.equal(state.statusCode, 401);
      assert.deepEqual(state.body, {
        error: "Not authenticated",
      });
      assert.equal(expireMyListingMock.mock.callCount(), 0);
    });
  });
});
