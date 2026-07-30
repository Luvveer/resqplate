import assert from "node:assert/strict";
import { beforeEach, describe, it, mock } from "node:test";
import type {
  AdminRestaurantProfile,
  VerificationStatus,
} from "../admin.types.js";

const restaurantId = "9ea56274-afce-4d3e-89ed-31a99a973eca";

function makeRestaurant(
  overrides: Partial<AdminRestaurantProfile> = {},
): AdminRestaurantProfile {
  const now = new Date("2026-07-25T12:00:00");

  return {
    id: restaurantId,
    profileId: "a2d85cc3-f47b-4243-b339-d4822b33d9dc",
    businessName: "Tiffin Wala",
    address: "2086 Meadowood Park",
    city: "Burnaby",
    province: "British Columbia",
    postalCode: "V5A 4G2",
    phone: "7782843310",
    description: "Indian food",
    latitude: "49.282700",
    longitude: "-122.940000",
    verificationStatus: "PENDING",
    adminNotes: null,
    verifiedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

let restaurants: AdminRestaurantProfile[] = [];
let findByIdResult: AdminRestaurantProfile | undefined;
let updateResult: AdminRestaurantProfile | undefined;

const findRestaurantProfilesMock = mock.fn(
  async (status?: VerificationStatus): Promise<AdminRestaurantProfile[]> => {
    if (!status) {
      return restaurants;
    }

    return restaurants.filter(
      (restaurant) => restaurant.verificationStatus === status,
    );
  },
);

const findRestaurantProfileByIdMock = mock.fn(
  async (_restaurantId: string): Promise<AdminRestaurantProfile | undefined> =>
    findByIdResult,
);

const updateRestaurantVerificationMock = mock.fn(
  async (
    id: string,
    input: {
      verificationStatus: VerificationStatus;
      adminNotes?: string | null;
      verifiedAt?: Date | null;
    },
  ): Promise<AdminRestaurantProfile | undefined> => {
    if (!updateResult) {
      return undefined;
    }

    return {
      ...updateResult,
      id,
      verificationStatus: input.verificationStatus,
      adminNotes: input.adminNotes ?? null,
      verifiedAt: input.verifiedAt ?? null,
    };
  },
);

const safeSyncRestaurantListingsToAlgoliaMock = mock.fn(
  async (_restaurantId: string): Promise<void> => undefined,
);

mock.module("../admin.repository.js", {
  namedExports: {
    findRestaurantProfiles: findRestaurantProfilesMock,
    findRestaurantProfileById: findRestaurantProfileByIdMock,
    updateRestaurantVerification: updateRestaurantVerificationMock,
  },
});

mock.module("../../external-services/algolia/algolia.service.js", {
  namedExports: {
    safeSyncRestaurantListingsToAlgolia:
      safeSyncRestaurantListingsToAlgoliaMock,
  },
});

const {
  getRestaurantProfiles,
  getRestaurantProfile,
  approveRestaurant,
  rejectRestaurant,
  requestRestaurantInfo,
  suspendRestaurant,
} = await import("../admin.service.js");

beforeEach(() => {
  restaurants = [];
  findByIdResult = undefined;
  updateResult = undefined;

  findRestaurantProfilesMock.mock.resetCalls();
  findRestaurantProfileByIdMock.mock.resetCalls();
  updateRestaurantVerificationMock.mock.resetCalls();
  safeSyncRestaurantListingsToAlgoliaMock.mock.resetCalls();
});

describe("admin service", () => {
  it("returns every restaurant when status is not given", async () => {
    restaurants = [
      makeRestaurant(),
      makeRestaurant({
        id: "e45dd70b-0a1e-4901-90d9-cf73238344a0",
        verificationStatus: "APPROVED",
      }),
    ];

    const result = await getRestaurantProfiles();

    assert.equal(result.length, 2);
    assert.equal(findRestaurantProfilesMock.mock.callCount(), 1);
    assert.equal(
      findRestaurantProfilesMock.mock.calls[0]?.arguments[0],
      undefined,
    );
  });

  it("passes status filter to the repository", async () => {
    restaurants = [
      makeRestaurant({ verificationStatus: "PENDING" }),
      makeRestaurant({
        id: "e45dd70b-0a1e-4901-90d9-cf73238344a0",
        verificationStatus: "APPROVED",
      }),
    ];

    const result = await getRestaurantProfiles("APPROVED");

    assert.equal(result.length, 1);
    assert.equal(result[0]?.verificationStatus, "APPROVED");
  });

  it("returns one restaurant by ID", async () => {
    findByIdResult = makeRestaurant();

    const result = await getRestaurantProfile(restaurantId);

    assert.deepEqual(result, findByIdResult);
    assert.equal(
      findRestaurantProfileByIdMock.mock.calls[0]?.arguments[0],
      restaurantId,
    );
  });

  it("returns undefined when restaurant does not exist", async () => {
    const result = await getRestaurantProfile(restaurantId);

    assert.equal(result, undefined);
  });

  it("approves a restaurant and sets verifiedAt", async () => {
    findByIdResult = makeRestaurant();
    updateResult = makeRestaurant();

    const result = await approveRestaurant(restaurantId, {
      adminNotes: "Verified",
    });

    assert.equal(result.verificationStatus, "APPROVED");
    assert.equal(result.adminNotes, "Verified");
    assert.ok(result.verifiedAt instanceof Date);

    const updateInput =
      updateRestaurantVerificationMock.mock.calls[0]?.arguments[1];

    assert.equal(updateInput?.verificationStatus, "APPROVED");
    assert.ok(updateInput?.verifiedAt instanceof Date);
    assert.equal(
      safeSyncRestaurantListingsToAlgoliaMock.mock.calls[0]?.arguments[0],
      restaurantId,
    );
  });

  it("uses null when approval notes are omitted", async () => {
    findByIdResult = makeRestaurant();
    updateResult = makeRestaurant();

    await approveRestaurant(restaurantId, {});

    const updateInput =
      updateRestaurantVerificationMock.mock.calls[0]?.arguments[1];

    assert.equal(updateInput?.adminNotes, null);
  });

  it("rejects restaurant without setting verifiedAt", async () => {
    findByIdResult = makeRestaurant();
    updateResult = makeRestaurant();

    const result = await rejectRestaurant(restaurantId, {
      adminNotes: "Documents invalid",
    });

    assert.equal(result.verificationStatus, "REJECTED");
    assert.equal(result.verifiedAt, null);
  });

  it("request additional restaurant information", async () => {
    findByIdResult = makeRestaurant();
    updateResult = makeRestaurant();

    const result = await requestRestaurantInfo(restaurantId, {
      adminNotes: "Upload your permit",
    });

    assert.equal(result.verificationStatus, "INFO_REQUESTED");
    assert.equal(result.adminNotes, "Upload your permit");
    assert.equal(result.verifiedAt, null);
  });

  it("suspend a restaurant", async () => {
    findByIdResult = makeRestaurant({ verificationStatus: "APPROVED" });
    updateResult = makeRestaurant({ verificationStatus: "APPROVED" });

    const result = await suspendRestaurant(restaurantId, {
      adminNotes: "Policy violation",
    });

    assert.equal(result.verificationStatus, "SUSPENDED");
    assert.equal(result.verifiedAt, null);
  });

  it("throws error when the restaurant does not exist", async () => {
    await assert.rejects(
      approveRestaurant(restaurantId, {}),
      /Restaurant profile not found/,
    );

    assert.equal(updateRestaurantVerificationMock.mock.callCount(), 0);
    assert.equal(safeSyncRestaurantListingsToAlgoliaMock.mock.callCount(), 0);
  });

  it("throws error when the repository update returns undefined", async () => {
    findByIdResult = makeRestaurant();
    updateResult = undefined;

    await assert.rejects(
      approveRestaurant(restaurantId, {}),
      /Failed to update restaurant verification status/,
    );

    assert.equal(safeSyncRestaurantListingsToAlgoliaMock.mock.callCount(), 0);
  });

  it("synchronize Algolia after every successful status change", async () => {
    findByIdResult = makeRestaurant();
    updateResult = makeRestaurant();

    await approveRestaurant(restaurantId, {});
    await rejectRestaurant(restaurantId, {});
    await requestRestaurantInfo(restaurantId, {});
    await suspendRestaurant(restaurantId, {});

    assert.equal(safeSyncRestaurantListingsToAlgoliaMock.mock.callCount(), 4);
  });
});
