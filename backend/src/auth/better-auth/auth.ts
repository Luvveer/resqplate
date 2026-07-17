import "dotenv/config";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../../db/index.js";
import * as authSchema from "../../db/auth-schema.js";
import { sendResetPasswordEmail } from "../email/email.js";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    "https://resqplate.pages.dev",
    "https://app.resqplate.me",
    "http://localhost:5173",
  ],
  advanced: {
    useSecureCookies: true,
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: true,
      path: "/",
      httpOnly: true,
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, token }) => {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      await sendResetPasswordEmail(user.email, resetUrl);
    },
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  user: {
    additionalFields: {},
  },
});

export default auth;
