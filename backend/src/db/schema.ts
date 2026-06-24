import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  text,
  jsonb,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema.js";
export const userRoleEnum = pgEnum("user_role", [
  "FOOD_SEEKER",
  "BUSINESS",
  "ADMIN",
]);

export const userStatusEnum = pgEnum("user_status", [
  "ACTIVE",
  "SUSPENDED",
  "DELETED",
]);

export const ProfileTable = pgTable("profile", {
  id: uuid("id").defaultRandom().primaryKey(),
  authId: text("authId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull(),
  status: userStatusEnum("status").default("ACTIVE").notNull(),
  dietaryPreferences: jsonb("dietary_preferences"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
