import assert from "node:assert/strict";
import { beforeEach, describe, it, mock } from "node:test";
import type { Request, Response } from "express";
import type {
  AdminRestaurantProfile,
  VerificationStatus,
} from "../admin.types.js";

const restaurantId = "9ea56274-afce-4d3e-89ed-31a99a973eca";
const secondRestaurantId = "e45dd70b-0a1e-4901-90d9-cf73238344a0";

type VerificationActionInput = {
  adminNotes?: string;
};

function makeRestaurant(
  overrides: Partial<AdminRestaurantProfile> = {},
): AdminRestaurantProfile {
  const now = new Date("2026-07-25T12:00:00Z");

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

  return {
    response,
    state,
  };
}

function makeRequest(
  overrides: {
    query?: Record<string, string>;
    params?: Record<string, string>;
    body?: unknown;
  } = {},
): Request {
  return {
    query: overrides.query ?? {},
    params: overrides.params ?? {},
    body: overrides.body ?? {},
  } as Request;
}

let restaurantsResult: AdminRestaurantProfile[];
let restaurantResult: AdminRestaurantProfile | undefined;
let serviceError: unknown;

function throwServiceErrorIfPresent(): void {
  if (serviceError !== undefined) {
    throw serviceError;
  }
}

const getRestaurantProfilesMock = mock.fn(
  async (_status?: VerificationStatus): Promise<AdminRestaurantProfile[]> => {
    throwServiceErrorIfPresent();
    return restaurantsResult;
  },
);

const getRestaurantProfileMock = mock.fn(
  async (
    _restaurantId: string,
  ): Promise<AdminRestaurantProfile | undefined> => {
    throwServiceErrorIfPresent();
    return restaurantResult;
  },
);

const approveRestaurantMock = mock.fn(
  async (
    _restaurantId: string,
    _input: VerificationActionInput,
  ): Promise<AdminRestaurantProfile> => {
    throwServiceErrorIfPresent();

    if (!restaurantResult) {
      throw new Error("Missing restaurant fixture");
    }

    return restaurantResult;
  },
);

const rejectRestaurantMock = mock.fn(
  async (
    _restaurantId: string,
    _input: VerificationActionInput,
  ): Promise<AdminRestaurantProfile> => {
    throwServiceErrorIfPresent();

    if (!restaurantResult) {
      throw new Error("Missing restaurant fixture");
    }

    return restaurantResult;
  },
);

const requestRestaurantInfoMock = mock.fn(
  async (
    _restaurantId: string,
    _input: VerificationActionInput,
  ): Promise<AdminRestaurantProfile> => {
    throwServiceErrorIfPresent();

    if (!restaurantResult) {
      throw new Error("Missing restaurant fixture");
    }

    return restaurantResult;
  },
);

const suspendRestaurantMock = mock.fn(
  async (
    _restaurantId: string,
    _input: VerificationActionInput,
  ): Promise<AdminRestaurantProfile> => {
    throwServiceErrorIfPresent();

    if (!restaurantResult) {
      throw new Error("Missing restaurant fixture");
    }

    return restaurantResult;
  },
);

mock.module("../admin.service.js", {
  namedExports: {
    getRestaurantProfiles: getRestaurantProfilesMock,
    getRestaurantProfile: getRestaurantProfileMock,
    approveRestaurant: approveRestaurantMock,
    rejectRestaurant: rejectRestaurantMock,
    requestRestaurantInfo: requestRestaurantInfoMock,
    suspendRestaurant: suspendRestaurantMock,
  },
});

const {
  getRestaurantsHandler,
  getRestaurantHandler,
  approveRestaurantHandler,
  rejectRestaurantHandler,
  requestRestaurantInfoHandler,
  suspendRestaurantHandler,
} = await import("../admin.handler.js");

beforeEach(() => {
  restaurantsResult = [
    makeRestaurant(),
    makeRestaurant({
      id: secondRestaurantId,
      businessName: "Second Restaurant",
      verificationStatus: "APPROVED",
    }),
  ];

  restaurantResult = makeRestaurant();
  serviceError = undefined;

  for (const mockedFunction of [
    getRestaurantProfilesMock,
    getRestaurantProfileMock,
    approveRestaurantMock,
    rejectRestaurantMock,
    requestRestaurantInfoMock,
    suspendRestaurantMock,
  ]) {
    mockedFunction.mock.resetCalls();
  }
});

describe("admin handlers", () => {
  describe("getRestaurantsHandler", () => {
    it("returns all restaurants without status filter", async () => {
      const request = makeRequest();
      const { response, state } = makeResponse();

      await getRestaurantsHandler(request, response);

      assert.equal(state.statusCode, 200);
      assert.deepEqual(state.body, {
        restaurants: restaurantsResult,
      });

      const call = getRestaurantProfilesMock.mock.calls[0];

      assert.ok(call);
      assert.equal(call.arguments[0], undefined);
    });

    it("passes valid status filter to the service", async () => {
      restaurantsResult = [
        makeRestaurant({
          verificationStatus: "APPROVED",
        }),
      ];

      const request = makeRequest({
        query: {
          status: "APPROVED",
        },
      });
      const { response, state } = makeResponse();

      await getRestaurantsHandler(request, response);

      assert.equal(state.statusCode, 200);
      assert.deepEqual(state.body, {
        restaurants: restaurantsResult,
      });

      const call = getRestaurantProfilesMock.mock.calls[0];

      assert.ok(call);
      assert.equal(call.arguments[0], "APPROVED");
    });

    it("reject invalid status query before calling the service", async () => {
      const request = makeRequest({
        query: {
          status: "INVALID_STATUS",
        },
      });
      const { response } = makeResponse();

      await assert.rejects(getRestaurantsHandler(request, response));

      assert.equal(getRestaurantProfilesMock.mock.callCount(), 0);
    });
  });

  describe("getRestaurantHandler", () => {
    it("return one restaurant", async () => {
      const request = makeRequest({
        params: {
          restaurantId,
        },
      });
      const { response, state } = makeResponse();

      await getRestaurantHandler(request, response);

      assert.equal(state.statusCode, 200);
      assert.deepEqual(state.body, {
        restaurant: restaurantResult,
      });

      const call = getRestaurantProfileMock.mock.calls[0];

      assert.ok(call);
      assert.equal(call.arguments[0], restaurantId);
    });

    it("return 404 when restaurant does not exist", async () => {
      restaurantResult = undefined;

      const request = makeRequest({
        params: {
          restaurantId,
        },
      });
      const { response, state } = makeResponse();

      await getRestaurantHandler(request, response);

      assert.equal(state.statusCode, 404);
      assert.deepEqual(state.body, {
        error: "Restaurant profile not found",
      });
    });

    it("reject invalid restaurant UUID", async () => {
      const request = makeRequest({
        params: {
          restaurantId: "not-a-uuid",
        },
      });
      const { response } = makeResponse();

      await assert.rejects(getRestaurantHandler(request, response));

      assert.equal(getRestaurantProfileMock.mock.callCount(), 0);
    });
  });

  describe("approveRestaurantHandler", () => {
    it("return approved restaurant", async () => {
      restaurantResult = makeRestaurant({
        verificationStatus: "APPROVED",
        adminNotes: "Verified",
        verifiedAt: new Date("2026-07-25T12:00:00Z"),
      });

      const request = makeRequest({
        params: {
          restaurantId,
        },
        body: {
          adminNotes: "Verified",
        },
      });
      const { response, state } = makeResponse();

      await approveRestaurantHandler(request, response);

      assert.equal(state.statusCode, 200);
      assert.deepEqual(state.body, {
        restaurant: restaurantResult,
      });

      const call = approveRestaurantMock.mock.calls[0];

      assert.ok(call);
      assert.equal(call.arguments[0], restaurantId);
      assert.deepEqual(call.arguments[1], {
        adminNotes: "Verified",
      });
    });

    it("allow approval without admin notes", async () => {
      restaurantResult = makeRestaurant({
        verificationStatus: "APPROVED",
      });

      const request = makeRequest({
        params: {
          restaurantId,
        },
        body: {},
      });
      const { response, state } = makeResponse();

      await approveRestaurantHandler(request, response);

      assert.equal(state.statusCode, 200);

      const call = approveRestaurantMock.mock.calls[0];

      assert.ok(call);
      assert.deepEqual(call.arguments[1], {});
    });

    it("return 404 when approval fails", async () => {
      serviceError = new Error("Restaurant profile not found");

      const request = makeRequest({
        params: {
          restaurantId,
        },
        body: {
          adminNotes: "Verified",
        },
      });
      const { response, state } = makeResponse();

      await approveRestaurantHandler(request, response);

      assert.equal(state.statusCode, 404);
      assert.deepEqual(state.body, {
        error: "Restaurant profile not found",
      });
    });
  });

  describe("rejectRestaurantHandler", () => {
    it("return rejected restaurant", async () => {
      restaurantResult = makeRestaurant({
        verificationStatus: "REJECTED",
        adminNotes: "Invalid permit",
      });

      const request = makeRequest({
        params: {
          restaurantId,
        },
        body: {
          adminNotes: "Invalid permit",
        },
      });
      const { response, state } = makeResponse();

      await rejectRestaurantHandler(request, response);

      assert.equal(state.statusCode, 200);
      assert.deepEqual(state.body, {
        restaurant: restaurantResult,
      });

      const call = rejectRestaurantMock.mock.calls[0];

      assert.ok(call);
      assert.equal(call.arguments[0], restaurantId);
      assert.deepEqual(call.arguments[1], {
        adminNotes: "Invalid permit",
      });
    });

    it("return 404 when rejection fails", async () => {
      serviceError = new Error(
        "Failed to update restaurant verification status",
      );

      const request = makeRequest({
        params: {
          restaurantId,
        },
        body: {
          adminNotes: "Invalid permit",
        },
      });
      const { response, state } = makeResponse();

      await rejectRestaurantHandler(request, response);

      assert.equal(state.statusCode, 404);
      assert.deepEqual(state.body, {
        error: "Failed to update restaurant verification status",
      });
    });
  });

  describe("requestRestaurantInfoHandler", () => {
    it("return restaurant with information requested", async () => {
      restaurantResult = makeRestaurant({
        verificationStatus: "INFO_REQUESTED",
        adminNotes: "Upload the business permit",
      });

      const request = makeRequest({
        params: {
          restaurantId,
        },
        body: {
          adminNotes: "Upload the business permit",
        },
      });
      const { response, state } = makeResponse();

      await requestRestaurantInfoHandler(request, response);

      assert.equal(state.statusCode, 200);
      assert.deepEqual(state.body, {
        restaurant: restaurantResult,
      });

      const call = requestRestaurantInfoMock.mock.calls[0];

      assert.ok(call);
      assert.equal(call.arguments[0], restaurantId);
      assert.deepEqual(call.arguments[1], {
        adminNotes: "Upload the business permit",
      });
    });

    it("return 404 when requesting information fails", async () => {
      serviceError = new Error("Restaurant profile not found");

      const request = makeRequest({
        params: {
          restaurantId,
        },
        body: {
          adminNotes: "Upload the business permit",
        },
      });
      const { response, state } = makeResponse();

      await requestRestaurantInfoHandler(request, response);

      assert.equal(state.statusCode, 404);
      assert.deepEqual(state.body, {
        error: "Restaurant profile not found",
      });
    });
  });

  describe("suspendRestaurantHandler", () => {
    it("return suspended restaurant", async () => {
      restaurantResult = makeRestaurant({
        verificationStatus: "SUSPENDED",
        adminNotes: "Policy violation",
      });

      const request = makeRequest({
        params: {
          restaurantId,
        },
        body: {
          adminNotes: "Policy violation",
        },
      });
      const { response, state } = makeResponse();

      await suspendRestaurantHandler(request, response);

      assert.equal(state.statusCode, 200);
      assert.deepEqual(state.body, {
        restaurant: restaurantResult,
      });

      const call = suspendRestaurantMock.mock.calls[0];

      assert.ok(call);
      assert.equal(call.arguments[0], restaurantId);
      assert.deepEqual(call.arguments[1], {
        adminNotes: "Policy violation",
      });
    });

    it("return 404 when suspension fails", async () => {
      serviceError = new Error("Restaurant profile not found");

      const request = makeRequest({
        params: {
          restaurantId,
        },
        body: {
          adminNotes: "Policy violation",
        },
      });
      const { response, state } = makeResponse();

      await suspendRestaurantHandler(request, response);

      assert.equal(state.statusCode, 404);
      assert.deepEqual(state.body, {
        error: "Restaurant profile not found",
      });
    });
  });
});
