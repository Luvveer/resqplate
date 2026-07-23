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
const BUSINESS_EMAIL_2 = "business2@demo.com";
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

//reinserting a new restaurant profile and food listings for the business user, and a seeker user, and an admin user
async function ensureRestaurant(input: {
  profileId: string;
  businessName: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  description: string;
  latitude: string;
  longitude: string;
}) {
  let [restaurant] = await db
    .select()
    .from(restaurantProfilesTable)
    .where(eq(restaurantProfilesTable.profileId, input.profileId));

  if (!restaurant) {
    [restaurant] = await db
      .insert(restaurantProfilesTable)
      .values({
        profileId: input.profileId,
        businessName: input.businessName,
        address: input.address,
        city: input.city,
        province: "BC",
        postalCode: input.postalCode,
        phone: input.phone,
        description: input.description,
        latitude: input.latitude,
        longitude: input.longitude,
        verificationStatus: "APPROVED",
        verifiedAt: new Date(),
      })
      .returning();
  }

  if (!restaurant) {
    throw new Error(
      `Failed to create restaurant profile for ${input.businessName}`,
    );
  }

  return restaurant;
}

async function seed() {
  console.log("Seeding database...");

  // Users
  const businessProfileId = await ensureUser({
    email: BUSINESS_EMAIL,
    name: "Demo Bakery",
    role: "BUSINESS",
  });
  const businessProfileId2 = await ensureUser({
    email: BUSINESS_EMAIL_2,
    name: "Demo Grocer",
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

  // Two approved restaurants ~9km apart
  const restaurant = await ensureRestaurant({
    profileId: businessProfileId,
    businessName: "Demo Bakery",
    address: "123 Demo St",
    city: "Burnaby",
    postalCode: "V5A 1S6",
    phone: "123-456-7890",
    description: "A demo bakery for testing purposes as data.",
    latitude: "49.248800",
    longitude: "-123.001600",
  });

  const restaurant2 = await ensureRestaurant({
    profileId: businessProfileId2,
    businessName: "Demo Grocer",
    address: "456 Granville St",
    city: "Vancouver",
    postalCode: "V6C 1V5",
    phone: "604-555-0142",
    description: "A demo grocer downtown, for testing distance sorting.",
    latitude: "49.282700",
    longitude: "-123.120700",
  });
  console.log("the restaurant profiles are ready"); //log the restaurant profiles

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
  for (const owner of [restaurant, restaurant2]) {
    await db
      .delete(foodListingsTable)
      .where(eq(foodListingsTable.restaurantId, owner.id));
  }

  const hour = 60 * 60 * 1000;
  const now = Date.now();
  const listingSeeds = [
    {
      owner: restaurant,
      title: "Assorted Bread Loaves",
      description: "End-of-day sourdough and rye.",
      category: "Bakery",
      quantityAvailable: 8,
      allergens: ["Gluten"],
    },
    {
      owner: restaurant,
      title: "Croissants (the 6 pack)",
      description: "Freshly baked croissants, perfect for breakfast.",
      category: "Bakery",
      quantityAvailable: 6,
      allergens: ["Gluten", "Dairy", "Eggs"],
    },
    {
      owner: restaurant,
      title: "Vegggie Sandwiches Platter",
      description: "A delicious selection of vegetarian sandwiches.",
      category: "Prepared Meals",
      quantityAvailable: 3,
      allergens: ["Gluten", "Soy"],
    },
    {
      owner: restaurant,
      title: "Fruits Salad Cups",
      description: "Fresh fruit salad cups, perfect for a healthy snack.",
      category: "Produced",
      quantityAvailable: 10,
      allergens: [],
    },
    {
      owner: restaurant2,
      title: "Day-Old Bagels",
      description: "Mixed bagels from the downtown counter.",
      category: "Bakery",
      quantityAvailable: 12,
      allergens: ["Gluten"],
    },
    {
      owner: restaurant2,
      title: "Surplus Produce Box",
      description: "Mixed seasonal vegetables, still perfectly good.",
      category: "Produced",
      quantityAvailable: 5,
      allergens: [],
    },
  ];

  for (const seedItem of listingSeeds) {
    const [listing] = await db
      .insert(foodListingsTable)
      .values({
        restaurantId: seedItem.owner.id,
        title: seedItem.title,
        description: seedItem.description,
        category: seedItem.category,
        quantityAvailable: seedItem.quantityAvailable,
        pickupStart: new Date(now + hour), // 1 hour from now
        // 12 hours out so that there is time to test
        pickupEnd: new Date(now + 12 * hour),
        addressSnapShot: `${seedItem.owner.address}, ${seedItem.owner.city}, BC ${seedItem.owner.postalCode}`,
        // Mirrors createMyListing in production
        latitude: seedItem.owner.latitude,
        longitude: seedItem.owner.longitude,
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
  console.log(`  Business login: ${BUSINESS_EMAIL_2} / ${DEMO_PASSWORD}`);
  console.log(`  Seeker login:   ${SEEKER_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`  Admin login:   ${ADMIN_EMAIL} / ${DEMO_PASSWORD}`);
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
