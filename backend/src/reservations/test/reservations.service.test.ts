import assert from "node:assert/strict";
import { beforeEach, describe, it, mock } from "node:test";
import type { FoodListing } from "../../restaurants/restaurants.types.js";
import type {
  Reservation,
  ReservationWithListing,
} from "../reservations.types.js";

const profileId = "63251816-c0b4-4df2-ba6c-d944f1258239";
const otherProfileId = "11111111-2222-3333-4444-555555555555";
const listingId = "bbee02eb-20fb-480a-bbe1-05552121f436";
const restaurantId = "e5e92bdf-7395-4d1a-999b-c97dd20f65b0";
const reservationId = "9c1c4d2e-8f3a-4b6d-9e21-7a0b1c2d3e4f";

function futureWindow(): { start: Date; end: Date } {
  const start = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
  return { start, end };
}

const WINDOW = futureWindow();
const SLOT_MS = 60 * 60 * 1000;

function makeListing(overrides: Partial<FoodListing> = {}): FoodListing {
  const now = new Date("2026-07-25T12:00:00Z");
  return {
    id: listingId,
    restaurantId,
    title: "Bagels",
    description: null,
    imagePath: null,
    category: null,
    quantityAvailable: 3,
    pickupStart: WINDOW.start,
    pickupEnd: WINDOW.end,
    status: "AVAILABLE",
    addressSnapShot: null,
    latitude: null,
    longitude: null,
    storageNote: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeReservation(overrides: Partial<Reservation> = {}): Reservation {
  const now = new Date("2026-07-25T12:00:00Z");
  return {
    id: reservationId,
    profileId,
    listingId,
    pickupCodeDisplay: "X7MQR2",
    status: "RESERVED",
    reservedAt: now,
    pickedUpAt: null,
    cancelledAt: null,
    noShowAt: null,
    pickupSlotStart: WINDOW.start,
    pickupSlotEnd: new Date(WINDOW.start.getTime() + SLOT_MS),
    ...overrides,
  };
}

type ReserveInput = {
  profileId: string;
  listingId: string;
  pickupCodeDisplay: string;
  pickupSlotStart: Date;
  pickupSlotEnd: Date;
};

let listingResult: FoodListing | undefined;
let activeReservationResult: Reservation | undefined;
let reserveResult: { reservation: Reservation; listing: FoodListing };
let reservationByIdResult: Reservation | undefined;
let reservationsWithListingResult: ReservationWithListing[];
let cancelResult: Reservation;

const findListingByIdMock = mock.fn(
  async (_listingId: string): Promise<FoodListing | undefined> => listingResult,
);
const findActiveReservationForListingMock = mock.fn(
  async (
    _profileId: string,
    _listingId: string,
  ): Promise<Reservation | undefined> => activeReservationResult,
);
const reserveListingAtomicallyMock = mock.fn(
  async (
    _input: ReserveInput,
  ): Promise<{ reservation: Reservation; listing: FoodListing }> =>
    reserveResult,
);
const findReservationByIdMock = mock.fn(
  async (_reservationId: string): Promise<Reservation | undefined> =>
    reservationByIdResult,
);
const findReservationsWithListingByProfileIdMock = mock.fn(
  async (_profileId: string): Promise<ReservationWithListing[]> =>
    reservationsWithListingResult,
);
const cancelReservationAtomicallyMock = mock.fn(
  async (_reservationId: string, _listingId: string): Promise<Reservation> =>
    cancelResult,
);
const safeSyncingToAlgoliaMock = mock.fn(
  async (_listingId: string): Promise<void> => undefined,
);

mock.module("../../restaurants/restaurants.repository.js", {
  namedExports: { findListingById: findListingByIdMock },
});

mock.module("../reservations.repository.js", {
  namedExports: {
    findReservationById: findReservationByIdMock,
    findReservationsWithListingByProfileId:
      findReservationsWithListingByProfileIdMock,
    findActiveReservationForListing: findActiveReservationForListingMock,
    reserveListingAtomically: reserveListingAtomicallyMock,
    cancelReservationAtomically: cancelReservationAtomicallyMock,
  },
});

mock.module("../../external-services/algolia/algolia.service.js", {
  namedExports: { safeSyncingToAlgolia: safeSyncingToAlgoliaMock },
});

const { createReservation, getMyReservations, cancelReservation } =
  await import("../reservations.service.js");

beforeEach(() => {
  listingResult = makeListing();
  activeReservationResult = undefined;
  reserveResult = { reservation: makeReservation(), listing: makeListing() };
  reservationByIdResult = makeReservation();
  reservationsWithListingResult = [];
  cancelResult = makeReservation({
    status: "CANCELLED",
    cancelledAt: new Date("2026-07-25T13:00:00Z"),
  });

  for (const mockedFunction of [
    findListingByIdMock,
    findActiveReservationForListingMock,
    reserveListingAtomicallyMock,
    findReservationByIdMock,
    findReservationsWithListingByProfileIdMock,
    cancelReservationAtomicallyMock,
    safeSyncingToAlgoliaMock,
  ]) {
    mockedFunction.mock.resetCalls();
  }
});

describe("reservations service", () => {
  describe("createReservation", () => {
    it("reserves thew listing and returns the reservation", async () => {
      const reservation = await createReservation(profileId, {
        listingId,
        pickupSlotStart: WINDOW.start,
      });
      assert.deepEqual(reservation, reserveResult.reservation);

      const input = reserveListingAtomicallyMock.mock.calls[0]?.arguments[0];
      assert.equal(input?.profileId, profileId);
      assert.equal(input?.listingId, listingId);
      assert.equal(typeof input?.pickupCodeDisplay, "string");
      assert.equal(input?.pickupCodeDisplay.length, 6);
      assert.equal(input?.pickupSlotStart.getTime(), WINDOW.start.getTime());
      assert.equal(
        input?.pickupSlotEnd.getTime(),
        WINDOW.start.getTime() + SLOT_MS,
      );

      //link and sink the re-sinked for the updated listing
      assert.equal(
        safeSyncingToAlgoliaMock.mock.calls[0]?.arguments[0],
        reserveResult.listing.id,
      );
    });

    it("throws when the listing does not exist", async () => {
      listingResult = undefined;

      await assert.rejects(
        () =>
          createReservation(profileId, {
            listingId,
            pickupSlotStart: WINDOW.start,
          }),
        /listing does not exist/i,
      );
      assert.equal(reserveListingAtomicallyMock.mock.callCount(), 0);
    });

    it("throws when the pickup window has already expired", async () => {
      listingResult = makeListing({
        status: "AVAILABLE",
        pickupStart: new Date(Date.now() - 3 * SLOT_MS),
        pickupEnd: new Date(Date.now() - SLOT_MS),
      });

      await assert.rejects(
        () =>
          createReservation(profileId, {
            listingId,
            pickupSlotStart: WINDOW.start,
          }),
        /expired/i,
      );
      assert.equal(reserveListingAtomicallyMock.mock.callCount(), 0);
    });

    it("throws when the seeker already has an active reservation", async () => {
      activeReservationResult = makeReservation();
      await assert.rejects(
        () =>
          createReservation(profileId, {
            listingId,
            pickupSlotStart: WINDOW.start,
          }),
        /already reserved/i,
      );
      assert.equal(reserveListingAtomicallyMock.mock.callCount(), 0);
    });

    it("throws when the chosen pickup slot is not a valid boundary", async () => {
      await assert.rejects(
        () =>
          createReservation(profileId, {
            listingId,
            pickupSlotStart: new Date(WINDOW.start.getTime() + 7 * 60 * 1000),
          }),
        /not valid/i,
      );
      assert.equal(reserveListingAtomicallyMock.mock.callCount(), 0);
    });
  });

  describe("getMyReservations", () => {
    it("returns the seeker's reservations from the repository", async () => {
      const listing = makeListing();
      reservationsWithListingResult = [
        {
          ...makeReservation(),
          listing,
        },
      ];
      const result = await getMyReservations(profileId);
      assert.deepEqual(result, reservationsWithListingResult);
      assert.equal(
        findReservationsWithListingByProfileIdMock.mock.calls[0]?.arguments[0],
        profileId,
      );
    });
  });

  describe("calcelReservation", () => {
    it("cancels a reserved reservation owned by the seeker", async () => {
      reservationByIdResult = makeReservation({ status: "RESERVED" });
      const result = await cancelReservation(profileId, reservationId);
      assert.deepEqual(result, cancelResult);
      assert.deepEqual(
        cancelReservationAtomicallyMock.mock.calls[0]?.arguments,
        [reservationId, listingId],
      );
      assert.equal(
        safeSyncingToAlgoliaMock.mock.calls[0]?.arguments[0],
        listingId,
      );
    });

    it("throws when the reservations does not exist", async () => {
      reservationByIdResult = undefined;
      await assert.rejects(
        () => cancelReservation(profileId, reservationId),
        /not found/i,
      );
      assert.equal(cancelReservationAtomicallyMock.mock.callCount(), 0);
    });

    it("is thrown when the reservation belongs to another seeker", async () => {
      reservationByIdResult = makeReservation({ profileId: otherProfileId });
      await assert.rejects(
        () => cancelReservation(profileId, reservationId),
        /permission/i,
      );
      assert.equal(cancelReservationAtomicallyMock.mock.callCount(), 0);
    });

    it("throws when the reservation is not in a RESERVED state", async () => {
      reservationByIdResult = makeReservation({ status: "CANCELLED" });
      await assert.rejects(
        () => cancelReservation(profileId, reservationId),
        /Cannot cancel a reservation that is CANCELLED/,
      );
      assert.equal(cancelReservationAtomicallyMock.mock.callCount(), 0);
    });
  });
});
