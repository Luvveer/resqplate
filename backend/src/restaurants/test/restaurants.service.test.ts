import assert from "node:assert/strict";
import { beforeEach, describe, it, mock } from "node:test";
import type {
  Allergen,
  FoodListing,
  NewFoodListing,
  NewRestaurantProfile,
  RestaurantProfile,
  UpdateFoodListing,
} from "../restaurants.types.js";
import type {} from "multer";

const profileId = "63251816-c0b4-4df2-ba6c-d944f1258239";
const restaurantId = "e5e92bdf-7395-4d1a-999b-c97dd20f65b0";
const listingId = "bbee02eb-20fb-480a-bbe1-05552121f436";
const allergenId = "74090ef7-dfa8-48e4-91d5-62b1c356f16e";

function makeRestaurant(
  overrides: Partial<RestaurantProfile> = {},
): RestaurantProfile {
  const now = new Date("2026-07-25T12:00:00");

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
    ...overrides,
  };
}

function makeListing(overrides: Partial<FoodListing> = {}): FoodListing {
  const now = new Date("2026-07-25T12:00:00");

  return {
    id: listingId,
    restaurantId,
    title: "Banana shake",
    description: "Fresh shake",
    imagePath: null,
    category: "Drink",
    quantityAvailable: 5,
    pickupStart: new Date("2026-07-26T10:00:00"),
    pickupEnd: new Date("2026-07-26T12:00:00"),
    status: "AVAILABLE",
    addressSnapShot: "2086 Meadowood Park, Burnaby, British Columbia, V5A 4G2",
    latitude: "49.282700",
    longitude: "-122.940000",
    storageNote: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

const peanut: Allergen = {
  id: allergenId,
  name: "Peanut",
};

let restaurantResult: RestaurantProfile | undefined;
let listingResult: FoodListing | undefined;
let listingsResult: FoodListing[] = [];
let allergensResult: Allergen[] = [];
let createdRestaurantResult: RestaurantProfile = makeRestaurant();
let createdListingResult: FoodListing = makeListing();
let updatedListingResult: FoodListing | undefined = makeListing();
let updatedStatusResult: FoodListing | undefined = makeListing({
  status: "EXPIRED",
});
let saveImageShouldFail = false;
let updateListingShouldThrow = false;

const findRestaurantByProfileIdMock = mock.fn(
  async (_profileId: string): Promise<RestaurantProfile | undefined> =>
    restaurantResult,
);

const createRestaurantMock = mock.fn(
  async (_input: NewRestaurantProfile): Promise<RestaurantProfile> =>
    createdRestaurantResult,
);

const findListingsByRestaurantIdMock = mock.fn(
  async (_restaurantId: string): Promise<FoodListing[]> => listingsResult,
);

const findListingByRestaurantIdMock = mock.fn(
  async (
    _listingId: string,
    _restaurantId: string,
  ): Promise<FoodListing | undefined> => listingResult,
);

const createListingMock = mock.fn(
  async (_input: NewFoodListing): Promise<FoodListing> => createdListingResult,
);

const updateRestaurantMock = mock.fn(
  async (_restaurantId: string, _input: unknown) => restaurantResult,
);

const updateListingMock = mock.fn(
  async (
    _listingId: string,
    _input: UpdateFoodListing,
  ): Promise<FoodListing | undefined> => {
    if (updateListingShouldThrow) {
      throw new Error("Database failure");
    }

    return updatedListingResult;
  },
);

const updateListingStatusMock = mock.fn(
  async (
    _listingId: string,
    _status: "AVAILABLE" | "RESERVED" | "EXPIRED",
  ): Promise<FoodListing | undefined> => updatedStatusResult,
);

const findAllergensByIdsMock = mock.fn(
  async (_allergenIds: string[]): Promise<Allergen[]> => allergensResult,
);

const findListingAllergensMock = mock.fn(
  async (_listingId: string): Promise<Allergen[]> => allergensResult,
);

const replaceListingAllergensMock = mock.fn(
  async (_listingId: string, _allergenIds: string[]): Promise<Allergen[]> =>
    allergensResult,
);

const autocompleteAddressMock = mock.fn(
  async (_input: string, _sessionToken: string) => [
    {
      placeId: "place-1",
      description: "2086 Meadowood Park, Burnaby, BC",
    },
  ],
);

const resolveAddressMock = mock.fn(
  async (_placeId: string, _sessionToken: string) => ({
    googlePlaceId: "place-1",
    address: "2086 Meadowood Park",
    city: "Burnaby",
    province: "British Columbia",
    postalCode: "V5A 4G2",
    latitude: "49.282700",
    longitude: "-122.940000",
  }),
);

const saveImageMock = mock.fn(
  async (
    _buffer: Buffer,
    _mimetype: string,
    _folder: string,
  ): Promise<string> => {
    if (saveImageShouldFail) {
      throw new Error("Image save failed");
    }

    return "listings/new-image.jpg";
  },
);

const deleteFileMock = mock.fn(
  async (_filePath: string): Promise<void> => undefined,
);

const expireReservationForFoodListingMock = mock.fn(
  async (_listingId: string): Promise<void> => undefined,
);

const safeSyncingToAlgoliaMock = mock.fn(
  async (_listingId: string): Promise<void> => undefined,
);

const safeRemoveListingFromAlgoliaMock = mock.fn(
  async (_listingId: string): Promise<void> => undefined,
);

mock.module("../restaurants.repository.js", {
  namedExports: {
    findRestaurantByProfileId: findRestaurantByProfileIdMock,
    createRestaurant: createRestaurantMock,
    updateRestaurant: updateRestaurantMock,
    findListingsByRestaurantId: findListingsByRestaurantIdMock,
    findListingByRestaurantId: findListingByRestaurantIdMock,
    createListing: createListingMock,
    updateListing: updateListingMock,
    updateListingStatus: updateListingStatusMock,
    findAllergensByIds: findAllergensByIdsMock,
    findListingAllergens: findListingAllergensMock,
    replaceListingAllergens: replaceListingAllergensMock,
  },
});

mock.module("../../external-services/places/places.service.js", {
  namedExports: {
    autocompleteAddress: autocompleteAddressMock,
    resolveAddress: resolveAddressMock,
  },
});

mock.module("../../filesystem/filesystem.js", {
  namedExports: {
    saveImage: saveImageMock,
    deleteFile: deleteFileMock,
  },
});

mock.module("../../reservations/reservations.repository.js", {
  namedExports: {
    expireReservationForFoodListing: expireReservationForFoodListingMock,
  },
});

mock.module("../../external-services/algolia/algolia.service.js", {
  namedExports: {
    safeSyncingToAlgolia: safeSyncingToAlgoliaMock,
    safeRemoveListingFromAlgolia: safeRemoveListingFromAlgoliaMock,
  },
});

const {
  getMyRestaurant,
  getAddressSuggestions,
  createMyRestaurant,
  getMyListings,
  getMyListing,
  createMyListing,
  updateMyListing,
  updateMyListingImage,
  expireMyListing,
} = await import("../restaurants.service.js");

beforeEach(() => {
  restaurantResult = makeRestaurant();
  listingResult = makeListing();
  listingsResult = [makeListing()];
  allergensResult = [peanut];
  createdRestaurantResult = makeRestaurant();
  createdListingResult = makeListing();
  updatedListingResult = makeListing();
  updatedStatusResult = makeListing({ status: "EXPIRED" });
  saveImageShouldFail = false;
  updateListingShouldThrow = false;

  for (const mockedFunction of [
    findRestaurantByProfileIdMock,
    createRestaurantMock,
    findListingsByRestaurantIdMock,
    findListingByRestaurantIdMock,
    createListingMock,
    updateListingMock,
    updateListingStatusMock,
    findAllergensByIdsMock,
    findListingAllergensMock,
    replaceListingAllergensMock,
    autocompleteAddressMock,
    resolveAddressMock,
    saveImageMock,
    deleteFileMock,
    expireReservationForFoodListingMock,
    safeSyncingToAlgoliaMock,
    safeRemoveListingFromAlgoliaMock,
  ]) {
    mockedFunction.mock.resetCalls();
  }
});

describe("restaurants service", () => {
  it("returns current restaurant", async () => {
    const result = await getMyRestaurant(profileId);

    assert.deepEqual(result, restaurantResult);
  });

  it("returns address suggestions", async () => {
    const result = await getAddressSuggestions("2086 Meadowood", "session-1");

    assert.equal(result.length, 1);
    assert.equal(result[0]?.placeId, "place-1");
  });

  it("creates restaurant using the Google address", async () => {
    restaurantResult = undefined;

    const result = await createMyRestaurant(profileId, {
      businessName: "Tiffin Wala",
      placeId: "place-1",
      sessionToken: "session-1",
      phone: "7782843310",
      description: "Indian food",
    });

    assert.equal(result.id, restaurantId);
    assert.equal(resolveAddressMock.mock.callCount(), 1);

    const createCall = createRestaurantMock.mock.calls[0];

    assert.ok(createCall);

    const createInput = createCall.arguments[0];

    assert.equal(createInput.profileId, profileId);
    assert.equal(createInput.address, "2086 Meadowood Park");
    assert.equal(createInput.latitude, "49.282700");
    assert.equal("placeId" in createInput, false);
    assert.equal("sessionToken" in createInput, false);
  });

  it("does not create duplicate restaurant profile", async () => {
    await assert.rejects(
      createMyRestaurant(profileId, {
        businessName: "Tiffin Wala",
        placeId: "place-1",
        sessionToken: "session-1",
      }),
      /Restaurant profile already exists/,
    );

    assert.equal(resolveAddressMock.mock.callCount(), 0);
    assert.equal(createRestaurantMock.mock.callCount(), 0);
  });

  it("returns listings with their allergens", async () => {
    const result = await getMyListings(profileId);

    assert.equal(result.length, 1);
    assert.deepEqual(result[0]?.allergens, [peanut]);
  });

  it("rejects listing access when restaurant does not exist", async () => {
    restaurantResult = undefined;

    await assert.rejects(
      getMyListings(profileId),
      /No restaurant profile found/,
    );
  });

  it("rejects listing when restaurant is not approved", async () => {
    restaurantResult = makeRestaurant({
      verificationStatus: "PENDING",
    });

    await assert.rejects(
      getMyListings(profileId),
      /Restaurant profile must be approved/,
    );
  });

  it("returns one listing with allergens", async () => {
    const result = await getMyListing(profileId, listingId);

    assert.equal(result?.id, listingId);
    assert.deepEqual(result?.allergens, [peanut]);
  });

  it("returns undefined when listing does not belong to restaurant", async () => {
    listingResult = undefined;

    const result = await getMyListing(profileId, listingId);

    assert.equal(result, undefined);
  });

  it("create listing using restaurant location", async () => {
    const futureStart = new Date(Date.now() + 60 * 60 * 1000);
    const futureEnd = new Date(futureStart.getTime() + 2 * 60 * 60 * 1000);
    const result = await createMyListing(profileId, {
      title: "Banana shake",
      description: "Fresh shake",
      category: "Drink",
      quantityAvailable: 4,
      pickupStart: futureStart,
      pickupEnd: futureEnd,
      allergenIds: [allergenId],
    });

    assert.equal(result.id, listingId);

    const createInput = createListingMock.mock.calls[0]?.arguments[0];

    assert.equal(createInput.restaurantId, restaurantId);
    assert.equal(createInput.latitude, "49.282700");
    assert.equal(createInput.longitude, "-122.940000");
    assert.equal(createInput.status, "AVAILABLE");
    assert.equal(replaceListingAllergensMock.mock.callCount(), 1);
    assert.equal(safeSyncingToAlgoliaMock.mock.callCount(), 1);
  });

  it("rejects pickup end before pickup start", async () => {
    const futureStart = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const futureEnd = new Date(futureStart.getTime() - 60 * 60 * 1000);
    await assert.rejects(
      createMyListing(profileId, {
        title: "Food",
        quantityAvailable: 1,
        pickupStart: futureStart,
        pickupEnd: futureEnd,
      }),
      /Pickup end time must be after pickup start time/,
    );
  });

  it("rejects pickup window longer than 72 hours", async () => {
    const futureStart = new Date(Date.now() + 60 * 60 * 1000);
    const LateEnd = new Date(
      futureStart.getTime() + 72 * 60 * 60 * 1000 + 60 * 1000,
    );
    await assert.rejects(
      createMyListing(profileId, {
        title: "Food",
        quantityAvailable: 1,
        pickupStart: futureStart,
        pickupEnd: LateEnd,
      }),
      /Pickup window cannot be longer than 72 hours/,
    );
  });

  it("rejects invalid dates", async () => {
    await assert.rejects(
      createMyListing(profileId, {
        title: "Food",
        quantityAvailable: 1,
        pickupStart: new Date("invalid"),
        pickupEnd: new Date("invalid"),
      }),
      /must be valid date/,
    );
  });

  it("rejects unknown allergens", async () => {
    const futureStart = new Date(Date.now() + 60 * 60 * 1000);
    const futureEnd = new Date(futureStart.getTime() + 2 * 60 * 60 * 1000);
    allergensResult = [];

    await assert.rejects(
      createMyListing(profileId, {
        title: "Food",
        quantityAvailable: 1,
        pickupStart: futureStart,
        pickupEnd: futureEnd,
        allergenIds: [allergenId],
      }),
      /allergen were not found/,
    );
  });

  it("rejects listing creation without restaurant coordinates", async () => {
    const futureStart = new Date(Date.now() + 60 * 60 * 1000);
    const futureEnd = new Date(futureStart.getTime() + 2 * 60 * 60 * 1000);
    restaurantResult = makeRestaurant({ latitude: null });

    await assert.rejects(
      createMyListing(profileId, {
        title: "Food",
        quantityAvailable: 1,
        pickupStart: futureStart,
        pickupEnd: futureEnd,
      }),
      /Restaurant does not have valid location/,
    );
  });

  it("update an available listing", async () => {
    const result = await updateMyListing(profileId, listingId, {
      title: "Updated shake",
      allergenIds: [allergenId],
    });

    assert.equal(result?.id, listingId);
    assert.equal(updateListingMock.mock.callCount(), 1);
    assert.equal(replaceListingAllergensMock.mock.callCount(), 1);
    assert.equal(safeSyncingToAlgoliaMock.mock.callCount(), 1);
  });

  it("return undefined when updating missing listing", async () => {
    listingResult = undefined;

    const result = await updateMyListing(profileId, listingId, {
      title: "Updated",
    });

    assert.equal(result, undefined);
    assert.equal(updateListingMock.mock.callCount(), 0);
  });

  it("reject updates to expired listing", async () => {
    listingResult = makeListing({ status: "EXPIRED" });

    await assert.rejects(
      updateMyListing(profileId, listingId, { title: "Updated" }),
      /Only available listings can be update/,
    );
  });

  it("return undefined when repository update fails", async () => {
    updatedListingResult = undefined;

    const result = await updateMyListing(profileId, listingId, {
      title: "Updated",
    });

    assert.equal(result, undefined);
    assert.equal(safeSyncingToAlgoliaMock.mock.callCount(), 0);
  });

  it("uploads and replaces listing image", async () => {
    listingResult = makeListing({
      imagePath: "listings/old-image.jpg",
    });
    updatedListingResult = makeListing({
      imagePath: "listings/new-image.jpg",
    });

    const file = {
      buffer: Buffer.from("image"),
      mimetype: "image/jpeg",
    } as Express.Multer.File;

    const result = await updateMyListingImage(profileId, listingId, file);

    assert.equal(result?.imagePath, "listings/new-image.jpg");
    assert.equal(saveImageMock.mock.callCount(), 1);
    assert.equal(deleteFileMock.mock.callCount(), 1);
    assert.equal(
      deleteFileMock.mock.calls[0]?.arguments[0],
      "listings/old-image.jpg",
    );
  });

  it("deletes the newly saved image when database update throws error", async () => {
    updateListingShouldThrow = true;

    const file = {
      buffer: Buffer.from("image"),
      mimetype: "image/jpeg",
    } as Express.Multer.File;

    await assert.rejects(
      updateMyListingImage(profileId, listingId, file),
      /Database failure/,
    );

    assert.equal(
      deleteFileMock.mock.calls[0]?.arguments[0],
      "listings/new-image.jpg",
    );
  });

  it("return already expired listing without updating it", async () => {
    listingResult = makeListing({ status: "EXPIRED" });

    const result = await expireMyListing(profileId, listingId);

    assert.equal(result?.status, "EXPIRED");
    assert.equal(updateListingStatusMock.mock.callCount(), 0);
    assert.equal(expireReservationForFoodListingMock.mock.callCount(), 0);
  });

  it("expire available listing and associated reservations", async () => {
    const result = await expireMyListing(profileId, listingId);

    assert.equal(result?.status, "EXPIRED");
    assert.equal(updateListingStatusMock.mock.callCount(), 1);
    assert.equal(expireReservationForFoodListingMock.mock.callCount(), 1);
    assert.equal(safeRemoveListingFromAlgoliaMock.mock.callCount(), 1);
  });

  it("return undefined when expiring missing listing", async () => {
    listingResult = undefined;

    const result = await expireMyListing(profileId, listingId);

    assert.equal(result, undefined);
  });
});
