import assert from "node:assert/strict";
import { beforeEach, describe, it, mock } from "node:test";
import type { Request, Response } from "express";

const profileId = "a2d85cc3-f47b-4243-b339-d4822b33d9dc";
const reservationId = "e45dd70b-0a1e-4901-90d9-cf73238344a0";

function makeReservation(overrides: Record<string, unknown> = {}) {
  return {
    id: reservationId,
    profileId: "seeker-profile-id",
    listingId: "listing-id",
    pickupCodeDisplay: "ABC123",
    status: "RESERVED",
    reservedAt: new Date("2026-07-25T12:00:00Z"),
    pickedUpAt: null,
    cancelledAt: null,
    noShowAt: null,
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
  overrides: {
    profile?: { id: string } | undefined;
    query?: Record<string, string>;
    params?: Record<string, string>;
    body?: unknown;
  } = {},
): Request {
  return {
    profile: overrides.profile,
    query: overrides.query ?? {},
    params: overrides.params ?? {},
    body: overrides.body ?? {},
  } as unknown as Request;
}

let reservationsResult: unknown[] = [];
let confirmResult: unknown;
let noShowResult: unknown;
let searchResult: unknown[] = [];
let serviceError: unknown;

function throwServiceErrorIfPresent(): void {
  if (serviceError !== undefined) {
    throw serviceError;
  }
}

const getMyReservationsMock = mock.fn(
  async (_profileId: string, _status?: string) => {
    throwServiceErrorIfPresent();
    return reservationsResult;
  },
);

const confirmPickupMock = mock.fn(
  async (_profileId: string, _reservationId: string, _pickupCode: string) => {
    throwServiceErrorIfPresent();
    return confirmResult;
  },
);

const markNoShowMock = mock.fn(
  async (_profileId: string, _reservationId: string) => {
    throwServiceErrorIfPresent();
    return noShowResult;
  },
);

const searchReservationbyEmailMock = mock.fn(
  async (_profileId: string, _email: string) => {
    throwServiceErrorIfPresent();
    return searchResult;
  },
);

mock.module("../pickups.service.js", {
  namedExports: {
    getMyReservations: getMyReservationsMock,
    confirmPickup: confirmPickupMock,
    markNoShow: markNoShowMock,
    searchReservationbyEmail: searchReservationbyEmailMock,
  },
});

const {
  getReservationHandler,
  confirmPickupHandler,
  markNoShowHandler,
  searchReservationHandler,
} = await import("../pickups.handler.js");

beforeEach(() => {
  reservationsResult = [];
  confirmResult = undefined;
  noShowResult = undefined;
  searchResult = [];
  serviceError = undefined;

  getMyReservationsMock.mock.resetCalls();
  confirmPickupMock.mock.resetCalls();
  markNoShowMock.mock.resetCalls();
  searchReservationbyEmailMock.mock.resetCalls();
});

describe("getReservationHandler", () => {
  it("returns 401 when not authenticated", async () => {
    const { response, state } = makeResponse();
    await getReservationHandler(makeRequest({ profile: undefined }), response);

    assert.equal(state.statusCode, 401);
  });

  it("returns 200 with the reservation list", async () => {
    reservationsResult = [makeReservation()];
    const { response, state } = makeResponse();

    await getReservationHandler(
      makeRequest({ profile: { id: profileId } }),
      response,
    );

    assert.equal(state.statusCode, 200);
    assert.equal(
      (state.body as { reservations: unknown[] }).reservations.length,
      1,
    );
  });

  it("passes the status query filter through to the service", async () => {
    const { response } = makeResponse();

    await getReservationHandler(
      makeRequest({
        profile: { id: profileId },
        query: { status: "RESERVED" },
      }),
      response,
    );

    assert.equal(getMyReservationsMock.mock.calls[0]?.arguments[1], "RESERVED");
  });
});

describe("confirmPickupHandler", () => {
  it("returns 401 when not authenticated", async () => {
    const { response, state } = makeResponse();
    await confirmPickupHandler(
      makeRequest({
        profile: undefined,
        params: { reservationId },
        body: { pickupCode: "ABC123" },
      }),
      response,
    );

    assert.equal(state.statusCode, 401);
  });

  it("returns 404 when the service returns undefined", async () => {
    confirmResult = undefined;
    const { response, state } = makeResponse();

    await confirmPickupHandler(
      makeRequest({
        profile: { id: profileId },
        params: { reservationId },
        body: { pickupCode: "ABC123" },
      }),
      response,
    );

    assert.equal(state.statusCode, 404);
  });

  it("returns 409 when the service throws", async () => {
    serviceError = new Error("Incorrect Pick up Code");
    const { response, state } = makeResponse();

    await confirmPickupHandler(
      makeRequest({
        profile: { id: profileId },
        params: { reservationId },
        body: { pickupCode: "WRONGCODE" },
      }),
      response,
    );

    assert.equal(state.statusCode, 409);
    assert.equal(
      (state.body as { error: string }).error,
      "Incorrect Pick up Code",
    );
  });

  it("returns 200 with the confirmed reservation", async () => {
    confirmResult = makeReservation({ status: "PICKED_UP" });
    const { response, state } = makeResponse();

    await confirmPickupHandler(
      makeRequest({
        profile: { id: profileId },
        params: { reservationId },
        body: { pickupCode: "ABC123" },
      }),
      response,
    );

    assert.equal(state.statusCode, 200);
    assert.equal(
      (state.body as { reservation: { status: string } }).reservation.status,
      "PICKED_UP",
    );
  });
});

describe("markNoShowHandler", () => {
  it("returns 401 when not authenticated", async () => {
    const { response, state } = makeResponse();
    await markNoShowHandler(
      makeRequest({ profile: undefined, params: { reservationId } }),
      response,
    );

    assert.equal(state.statusCode, 401);
  });

  it("returns 404 when the service returns undefined", async () => {
    noShowResult = undefined;
    const { response, state } = makeResponse();

    await markNoShowHandler(
      makeRequest({ profile: { id: profileId }, params: { reservationId } }),
      response,
    );

    assert.equal(state.statusCode, 404);
  });

  it("returns 409 when the service throws", async () => {
    serviceError = new Error("This item is not reserved");
    const { response, state } = makeResponse();

    await markNoShowHandler(
      makeRequest({ profile: { id: profileId }, params: { reservationId } }),
      response,
    );

    assert.equal(state.statusCode, 409);
  });

  it("returns 200 with the updated reservation", async () => {
    noShowResult = makeReservation({ status: "NO_SHOW" });
    const { response, state } = makeResponse();

    await markNoShowHandler(
      makeRequest({ profile: { id: profileId }, params: { reservationId } }),
      response,
    );

    assert.equal(state.statusCode, 200);
    assert.equal(
      (state.body as { reservation: { status: string } }).reservation.status,
      "NO_SHOW",
    );
  });
});

describe("searchReservationHandler", () => {
  it("returns 401 when not authenticated", async () => {
    const { response, state } = makeResponse();
    await searchReservationHandler(
      makeRequest({ profile: undefined, query: { email: "seeker@demo.com" } }),
      response,
    );

    assert.equal(state.statusCode, 401);
  });

  it("returns 200 with matching reservations", async () => {
    searchResult = [makeReservation()];
    const { response, state } = makeResponse();

    await searchReservationHandler(
      makeRequest({
        profile: { id: profileId },
        query: { email: "seeker@demo.com" },
      }),
      response,
    );

    assert.equal(state.statusCode, 200);
    assert.equal(
      (state.body as { reservations: unknown[] }).reservations.length,
      1,
    );
    assert.equal(
      searchReservationbyEmailMock.mock.calls[0]?.arguments[1],
      "seeker@demo.com",
    );
  });
});
