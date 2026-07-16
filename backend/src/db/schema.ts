import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  text,
  jsonb,
  numeric,
  integer,
  primaryKey,
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

export const verificationStatusEnum = pgEnum("verification_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
  "INFO_REQUESTED",
]);

export const listingStatusEnum = pgEnum("listing_status", [
  "AVAILABLE",
  "RESERVED",
  "EXPIRED",
]);

export const reservationStatusEnum = pgEnum("reservation_status", [
  "RESERVED",
  "PICKED_UP",
  "CANCELLED",
  "EXPIRED",
  "NO_SHOW",
]);

export const reportReasonEnum = pgEnum("report_reason", [
  "UNSAFE_FOOD",
  "MISSING_ALLERGEN",
  "WRONG_QUALITY",
  "NOT_AVAILABLE",
  "BAD_PICKUP_EXPERIENCE",
  "OTHER",
]);

export const reportSeverityEnum = pgEnum("report_severity", [
  "LOW",
  "HIGH",
  "CRITICAL",
]);

export const ProfileTable = pgTable("profile", {
  id: uuid("id").defaultRandom().primaryKey(),
  authId: text("auth_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull(),
  status: userStatusEnum("status").default("ACTIVE").notNull(),
  dietaryPreferences: jsonb("dietary_preferences"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const restaurantProfilesTable = pgTable("restaurant_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id")
    .notNull()
    .unique()
    .references(() => ProfileTable.id, { onDelete: "cascade" }),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  province: varchar("province", { length: 100 }).notNull(),
  postalCode: varchar("postal_code", { length: 20 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  description: text("description"),
  latitude: numeric("latitude", { precision: 8, scale: 6 }),
  longitude: numeric("longitude", { precision: 9, scale: 6 }),
  verificationStatus: verificationStatusEnum("verification_status")
    .default("PENDING")
    .notNull(),
  adminNotes: text("admin_notes"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const foodListingsTable = pgTable("food_listings", {
  id: uuid("id").defaultRandom().primaryKey(),
  restaurantId: uuid("restaurant_id")
    .notNull()
    .references(() => restaurantProfilesTable.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  quantityAvailable: integer("quantity_available").notNull(),
  pickupStart: timestamp("pickup_start").notNull(),
  pickupEnd: timestamp("pickup_end").notNull(),
  status: listingStatusEnum("status").default("AVAILABLE").notNull(),
  addressSnapShot: text("address_snapshot"),
  latitude: numeric("latitude", { precision: 8, scale: 6 }),
  longitude: numeric("longitude", { precision: 9, scale: 6 }),
  storageNote: text("storage_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reservationTable = pgTable("reservations", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => ProfileTable.id, { onDelete: "cascade" }),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => foodListingsTable.id, { onDelete: "cascade" }),
  pickupSlotStart: timestamp("pickup_slot_start").notNull(),
  pickupSlotEnd: timestamp("pickup_slot_end").notNull(),
  pickupCodeDisplay: varchar("pickup_code_display", { length: 50 }),
  status: reservationStatusEnum("status").default("RESERVED").notNull(),
  reservedAt: timestamp("reserved_at").defaultNow().notNull(),
  pickedUpAt: timestamp("picked_up_at"),
  cancelledAt: timestamp("cancelled_at"),
  noShowAt: timestamp("no_show_at"),
});

export const reportsTable = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  reporterId: uuid("reporter_id")
    .notNull()
    .references(() => ProfileTable.id, { onDelete: "cascade" }),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => foodListingsTable.id, { onDelete: "cascade" }),
  restaurantId: uuid("restaurant_id")
    .notNull()
    .references(() => restaurantProfilesTable.id, { onDelete: "cascade" }),
  reason: reportReasonEnum("reason").notNull(),
  description: text("description"),
  severity: reportSeverityEnum("severity").default("LOW").notNull(),
  status: varchar("status", { length: 100 }),
  aiCategory: varchar("ai_category", { length: 255 }),
  aiSuggestedAction: text("ai_suggested_action"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

export const allergensTable = pgTable("allergens", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
});

export const listingAllergensTable = pgTable(
  "listing_allergens",
  {
    listingId: uuid("listing_id")
      .notNull()
      .references(() => foodListingsTable.id, { onDelete: "cascade" }),
    allergenId: uuid("allergen_id")
      .notNull()
      .references(() => allergensTable.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.listingId, table.allergenId],
    }),
  }),
);
