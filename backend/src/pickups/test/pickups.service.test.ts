import assert from "node:assert/strict";
import { beforeEach, describe, it, mock } from "node:test";

const restaurantId = "9ea56274-afce-4d3e-89ed-31a99a973eca";
const profileId = "a2d85cc3-f47b-4243-b339-d4822b33d9dc";
const reservationId = "e45dd70b-0a1e-4901-90d9-cf73238344a0";

function makeReservation(overrides: Record<string, unknown> = {}) {
  return {
    id: reservationId,
    profileId: "seeker-profile-id",
    listingId: "listing-id",
    pickupCodeDisplay: "ABC123",
    status: "RESERVED",
    reservedAt: new Date("2026-07-27T12:00:00"),
    pickedUpAt: null,
    cancelledAt: null,
    noShowAt: null,
    ...overrides,
  };
}

function makeRestaurant(overrides: Record<string, unknown> = {}) {
  return {
    id: restaurantId,
    profileId,
    businessName: "Demo Bakery",
    ...overrides,
  };
}

let restaurantResult: unknown;
let reservationResult: unknown;
let reservationsResult: unknown[] = [];
let confirmResult: unknown;
let noShowResult: unknown;

const findRestaurantByProfileIdMock = mock.fn(
  async (_profileId: string) => restaurantResult,
);
const findReservationForRestaurantMock = mock.fn(
  async (_reservationId: string, _restaurantId: string) => reservationResult,
);
const findReservationsByRestaurantMock = mock.fn(
  async (_restaurantId: string, _status?: string) => reservationsResult,
);
const findReservationByEmailMock = mock.fn(
  async (_restaurantId: string, _email: string) => reservationsResult,
);
const confirmReservationPickupMock = mock.fn(
  async (_reservationId: string) => confirmResult,
);
const markReservationNoShowMock = mock.fn(
  async (_reservationId: string) => noShowResult,
);

mock.module("../../restaurants/restaurants.repository.js", {
  namedExports: {
    findRestaurantByProfileId: findRestaurantByProfileIdMock,
  },
});

mock.module("../pickups.repository.js", {
  namedExports: {
    findReservationForRestaurant: findReservationForRestaurantMock,
    findReservationsByRestaurant: findReservationsByRestaurantMock,
    findReservationByEmail: findReservationByEmailMock,
    confirmReservationPickup: confirmReservationPickupMock,
    markReservationNoShow: markReservationNoShowMock,
  },
});

const {
  getRestaurantForProfile,
  getMyReservations,
  confirmPickup,
  markNoShow,
  searchReservationbyEmail,
} = await import("../pickups.service.js");

beforeEach(() => {
  restaurantResult = undefined;
  reservationResult = undefined;
  reservationsResult = [];
  confirmResult = undefined;
  noShowResult = undefined;

  findRestaurantByProfileIdMock.mock.resetCalls();
  findReservationForRestaurantMock.mock.resetCalls();
  findReservationsByRestaurantMock.mock.resetCalls();
  findReservationByEmailMock.mock.resetCalls();
  confirmReservationPickupMock.mock.resetCalls();
  markReservationNoShowMock.mock.resetCalls();
});

describe("pickups service", () => {
  describe("getRestaurantForProfile", () => {
    it("returns the restaurant when one exists for the profile", async () => {
      restaurantResult = makeRestaurant();

      const result = await getRestaurantForProfile(profileId);

      assert.deepEqual(result, restaurantResult);
      assert.equal(
        findRestaurantByProfileIdMock.mock.calls[0]?.arguments[0],
        profileId,
      );
    });

    it("throws when no restaurant exists for the profile", async () => {
      await assert.rejects(
        getRestaurantForProfile(profileId),
        /No restaurant profile found for this account/,
      );
    });
  });

  describe("getMyReservations", () => {
    it("resolves the restaurant and lists its reservations", async () => {
      restaurantResult = makeRestaurant();
      reservationsResult = [
        makeReservation(),
        makeReservation({ id: "second-id" }),
      ];

      const result = await getMyReservations(profileId, "RESERVED");

      assert.equal(result.length, 2);
      assert.equal(
        findReservationsByRestaurantMock.mock.calls[0]?.arguments[0],
        restaurantId,
      );
      assert.equal(
        findReservationsByRestaurantMock.mock.calls[0]?.arguments[1],
        "RESERVED",
      );
    });
  });

  describe("confirmPickup", () => {
    it("returns undefined when the reservation is not found or not owned by this restaurant", async () => {
      restaurantResult = makeRestaurant();
      reservationResult = undefined;

      const result = await confirmPickup(profileId, reservationId, "ABC123");

      assert.equal(result, undefined);
      assert.equal(confirmReservationPickupMock.mock.callCount(), 0);
    });

    it("throws when the reservation is not RESERVED", async () => {
      restaurantResult = makeRestaurant();
      reservationResult = makeReservation({ status: "PICKED_UP" });

      await assert.rejects(
        confirmPickup(profileId, reservationId, "ABC123"),
        /This item is not reserved/,
      );
    });

    it("throws when the pickup code does not match", async () => {
      restaurantResult = makeRestaurant();
      reservationResult = makeReservation({ pickupCodeDisplay: "ABC123" });

      await assert.rejects(
        confirmPickup(profileId, reservationId, "WRONGCODE"),
        /Incorrect Pick up Code/,
      );
      assert.equal(confirmReservationPickupMock.mock.callCount(), 0);
    });

    it("throws when the atomic update returns undefined (race condition)", async () => {
      restaurantResult = makeRestaurant();
      reservationResult = makeReservation({ pickupCodeDisplay: "ABC123" });
      confirmResult = undefined;

      await assert.rejects(
        confirmPickup(profileId, reservationId, "ABC123"),
        /Reservation just updated, please retry/,
      );
    });

    it("confirms the pickup when the code matches and the reservation is RESERVED", async () => {
      restaurantResult = makeRestaurant();
      reservationResult = makeReservation({ pickupCodeDisplay: "ABC123" });
      confirmResult = makeReservation({
        pickupCodeDisplay: "ABC123",
        status: "PICKED_UP",
      });

      const result = await confirmPickup(profileId, reservationId, "ABC123");

      assert.equal((result as { status: string }).status, "PICKED_UP");
      assert.equal(
        confirmReservationPickupMock.mock.calls[0]?.arguments[0],
        reservationId,
      );
    });
  });

  describe("markNoShow", () => {
    it("returns undefined when the reservation is not found or not owned by this restaurant", async () => {
      restaurantResult = makeRestaurant();
      reservationResult = undefined;

      const result = await markNoShow(profileId, reservationId);

      assert.equal(result, undefined);
      assert.equal(markReservationNoShowMock.mock.callCount(), 0);
    });

    it("throws when the reservation is not RESERVED", async () => {
      restaurantResult = makeRestaurant();
      reservationResult = makeReservation({ status: "NO_SHOW" });

      await assert.rejects(
        markNoShow(profileId, reservationId),
        /This item is not reserved/,
      );
    });

    it("throws when the atomic update returns undefined (race condition)", async () => {
      restaurantResult = makeRestaurant();
      reservationResult = makeReservation();
      noShowResult = undefined;

      await assert.rejects(
        markNoShow(profileId, reservationId),
        /Reservation just updated, please retry/,
      );
    });

    it("marks the reservation as a no-show", async () => {
      restaurantResult = makeRestaurant();
      reservationResult = makeReservation();
      noShowResult = makeReservation({ status: "NO_SHOW" });

      const result = await markNoShow(profileId, reservationId);

      assert.equal((result as { status: string }).status, "NO_SHOW");
    });
  });

  describe("searchReservationbyEmail", () => {
    it("resolves the restaurant and searches reservations by email, scoped to it", async () => {
      restaurantResult = makeRestaurant();
      reservationsResult = [makeReservation()];

      const result = await searchReservationbyEmail(
        profileId,
        "seeker@demo.com",
      );

      assert.equal(result.length, 1);
      assert.equal(
        findReservationByEmailMock.mock.calls[0]?.arguments[0],
        restaurantId,
      );
      assert.equal(
        findReservationByEmailMock.mock.calls[0]?.arguments[1],
        "seeker@demo.com",
      );
    });
  });
});
