import assert from "node:assert/strict";
import { describe, it, mock, afterEach, beforeEach } from "node:test";
// import type { Profile } from "../auth.types";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { user } from "../../db/auth-schema.js";
import { ProfileTable } from "../../db/schema.js";

const signupEmailMock = mock.fn(
  async (args: { body: { email: string; name: string } }) => ({
    headers: new Headers(),
    response: {
      user: { id: authId, email: args.body.email, name: args.body.name },
    },
  }),
);

const signInEmailMock = mock.fn(async (_args: unknown) => ({
  headers: new Headers(),
  response: { user: { id: authId } },
}));

const signOutMock = mock.fn(async (_args: unknown) => ({
  headers: new Headers({ "set-cookie": "cleared" }),
}));
const requestPasswordResetMock = mock.fn(async (_args: unknown) => undefined);
const resetPasswordMock = mock.fn(async (_args: unknown) => undefined);

mock.module("../better-auth/auth.js", {
  namedExports: {
    auth: {
      api: {
        signUpEmail: signupEmailMock,
        signInEmail: signInEmailMock,
        signOut: signOutMock,
        requestPasswordReset: requestPasswordResetMock,
        resetPassword: resetPasswordMock,
      },
    },
  },
});

const {
  signup,
  login,
  logout,
  confirmPasswordReset,
  updateSeekerProfile,
  requestPasswordReset,
} = await import("../auth.service.js");

let authId: string;

describe("auth service", () => {
  beforeEach(async () => {
    authId = randomUUID();
    await db.insert(user).values({
      id: authId,
      name: "User 1",
      email: "resqplate123@gmail.com",
      emailVerified: true,
    });
  });

  afterEach(async () => {
    await db.delete(user).where(eq(user.id, authId));
  });

  it("Signup a person", async () => {
    const result = await signup({
      email: "resqplate123@gmail.com",
      password: "password123",
      name: "User 1",
      role: "BUSINESS",
    });

    assert.equal(result.profile.authId, authId);
    assert.equal(result.profile.role, "BUSINESS");

    const [stored] = await db
      .select()
      .from(ProfileTable)
      .where(eq(ProfileTable.authId, authId));
    assert.equal(stored?.id, result.profile.id);
  });

  it("login a person", async () => {
    const [profile] = await db
      .insert(ProfileTable)
      .values({
        authId,
        email: "resqplate123@gmail.com",
        name: "User 1",
        role: "BUSINESS",
      })
      .returning();

    const result = await login({
      email: "resqplate123@gmail.com",
      password: "password123",
    });
    assert.equal(result?.profile.id, profile.id);
  });

  it("logout a person", async () => {
    const result = await logout(new Headers());
    assert.equal(result.get("set-cookie"), "cleared");
  });

  it("Reset Password request", async () => {
    await requestPasswordReset({
      email: "seeker@example.com",
      redirectTo: "http://localhost:5173/reset-password",
    });
    assert.equal(requestPasswordResetMock.mock.callCount(), 1);
  });

  it("Confirm Reset Password request", async () => {
    await confirmPasswordReset({
      newPassword: "newpassword123",
      token: "reset-token",
    });
    assert.equal(resetPasswordMock.mock.callCount(), 1);
  });

  it("Update profile details", async () => {
    const [profile] = await db
      .insert(ProfileTable)
      .values({
        authId,
        email: "resqplate123@gmail.com",
        name: "User 1",
        role: "BUSINESS",
      })
      .returning();

    const result = await updateSeekerProfile(profile?.id, {
      name: "Updated Name",
    });
    assert.equal(result.name, "Updated Name");
  });
});
