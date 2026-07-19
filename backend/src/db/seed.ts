import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./index.js";
import { auth } from "../auth/better-auth/auth.js";
import {
  ProfileTable,
  restaurantProfilesTable,
  foodListingsTable,
  allergensTable,
  listingAllergensTable,
} from "./schema.js";

// Major Seed script for the demo data to see the seeker workflow

const BUSINESS_EMAIL = "business@demo.com";
const SEEKER_EMAIL = "seeker@demo.com";
const ADMIN_EMAIL = "admin@demo.com";
const DEMO_PASSWORD = "password123";

//making a betterAuth user and the profile for the restaurant and the seeker
async function ensureUser(input: {
  email: string;
  name: string;
  role: "FOOD_SEEKER" | "BUSINESS";
}): Promise<string> {
  // if the user already exists then return the profileId
  const [existing] = await db
    .select()
    .from(ProfileTable)
    .where(eq(ProfileTable.email, input.email));
  if (existing) {
    return existing.id;
  }

  // create the user in betterAuth
  const { response } = await auth.api.signUpEmail({
    body: { email: input.email, password: DEMO_PASSWORD, name: input.name },
    returnHeaders: true,
  });

  const [profile] = await db
    .insert(ProfileTable)
    .values({
      authId: response.user.id,
      email: response.user.email,
      name: response.user.name,
      role: input.role,
    })
    .returning();

  if (!profile) {
    throw new Error(`Failed to create profile for ${input.email}`);
  }

  return profile.id;
}

async function seed() {
  console.log("Seeding database...");

  // Users
  const businessProfileId = await ensureUser({
    email: BUSINESS_EMAIL,
    name: "Demo Bakery",
    role: "BUSINESS",
  });
  await ensureUser({
    email: SEEKER_EMAIL,
    name: "Demo Seeker",
    role: "FOOD_SEEKER",
  });
  await ensureUser({
    email: ADMIN_EMAIL,
    name: "Demo ADMIN",
    role: "FOOD_SEEKER",
  });
  console.log("the user is ready"); //log the user

  // The restaurant profile for the business user, it is already approved
  let [restaurant] = await db
    .select()
    .from(restaurantProfilesTable)
    .where(eq(restaurantProfilesTable.profileId, businessProfileId));

  if (!restaurant) {
    [restaurant] = await db
      .insert(restaurantProfilesTable)
      .values({
        profileId: businessProfileId,
        businessName: "Demo Bakery",
        address: "123 Demo St",
        city: "Burnaby",
        province: "BC",
        postalCode: "V5A 1S6",
        phone: "123-456-7890",
        description: "A demo bakery for testing purposes as data.",
        latitude: "49.248800",
        longitude: "-123.001600",
        verificationStatus: "APPROVED",
        verifiedAt: new Date(),
      })
      .returning();
  }
  if (!restaurant) {
    throw new Error("Failed to create restaurant profile");
  }
  console.log("the restaurant profile is ready"); //log the restaurant profile

  // Allergies, do not include any that already exist
  const allergenNames = ["Gluten", "Dairy", "Nuts", "Soy", "Eggs"];
  const allergenIdByName = new Map<string, string>();
  for (const name of allergenNames) {
    const [existing] = await db
      .select()
      .from(allergensTable)
      .where(eq(allergensTable.name, name));
    if (existing) {
      allergenIdByName.set(name, existing.id);
      continue;
    }

    const [created] = await db
      .insert(allergensTable)
      .values({ name })
      .returning();
    if (created) {
      allergenIdByName.set(name, created.id);
    }
  }
  console.log("the allergens are ready"); //log the allergens

  //These are listings set in the future
  await db
    .delete(foodListingsTable)
    .where(eq(foodListingsTable.restaurantId, restaurant.id));

  const hour = 60 * 60 * 1000;
  const now = Date.now();
  const listingSeeds = [
    {
      title: "Assorted Bread Loaves",
      description: "End-of-day sourdough and rye.",
      category: "Bakery",
      quantityAvailable: 8,
      allergens: ["Gluten"],
    },
    {
      title: "Croissants (the 6 pack)",
      description: "Freshly baked croissants, perfect for breakfast.",
      category: "Bakery",
      quantityAvailable: 6,
      allergens: ["Gluten", "Dairy", "Eggs"],
    },
    {
      title: "Vegggie Sandwiches Platter",
      description: "A delicious selection of vegetarian sandwiches.",
      category: "Prepared Meals",
      quantityAvailable: 3,
      allergens: ["Gluten", "Soy"],
    },
    {
      title: "Fruits Salad Cups",
      description: "Fresh fruit salad cups, perfect for a healthy snack.",
      category: "Produced",
      quantityAvailable: 10,
      allergens: [],
    },
  ];

  for (const seedItem of listingSeeds) {
    const [listing] = await db
      .insert(foodListingsTable)
      .values({
        restaurantId: restaurant.id,
        title: seedItem.title,
        description: seedItem.description,
        category: seedItem.category,
        quantityAvailable: seedItem.quantityAvailable,
        pickupStart: new Date(now + hour), // 1 hour from now
        pickupEnd: new Date(now + 3 * hour), // 3 hours from now
        addressSnapShot: "123 university Drive(W), Burnaby, BC, V5A 1S6",
        status: "AVAILABLE",
      })
      .returning();

    if (listing && seedItem.allergens.length > 0) {
      await db.insert(listingAllergensTable).values(
        seedItem.allergens.map((name) => ({
          listingId: listing.id,
          allergenId: allergenIdByName.get(name)!,
        })),
      );
    }
  }

  console.log("the listings are ready");

  console.log(
    "The seeding is complete. You can now log in with the following credentials:",
  );
  console.log(`  Business login: ${BUSINESS_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`  Seeker login:   ${SEEKER_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`  Admin login:   ${ADMIN_EMAIL} / ${DEMO_PASSWORD}`);
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
