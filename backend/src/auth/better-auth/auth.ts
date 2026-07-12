import "dotenv/config";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../../db/index.js";
import * as authSchema from "../../db/auth-schema.js";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    "https://resqplate.pages.dev",
    "https://resqplate-api.luvveerlamba.workers.dev",
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  user: {
    additionalFields: {},
  },
});

export default auth;
