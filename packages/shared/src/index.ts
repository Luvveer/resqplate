import { z } from "zod";

export const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(["FOOD_SEEKER", "BUSINESS", "ADMIN"]),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export type UserRole = "FOOD_SEEKER" | "BUSINESS" | "ADMIN";
export type profileStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

export type ProfileResponse = {
  id: string;
  authId: string;
  email: string;
  name: string;
  role: UserRole;
  status: profileStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type RestaurantProfileResponse = {
  id: string;
  profileId: string;
  businessName: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string | null;
  description: string | null;
  verificationStatus:
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "SUSPENDED"
    | "INFO_REQUESTED";
  createdAt: Date;
  updatedAt: Date;
};

export const createRestaurantSchema = z.object({
  businessName: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  province: z.string().min(1),
  postalCode: z.string().min(1),
  phone: z.string().optional(),
  description: z.string().optional(),
});

export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;

/* Feature 2 */
export type ListingStatus = "AVAILABLE" | "RESERVED" | "EXPIRED";

export type AllergenResponse = {
  id: string;
  name: string;
};

export type FoodListingResponse = {
  id: string;
  restaurantId: string;
  title: string;
  description: string | null;
  category: string | null;
  quantityAvailable: number;
  pickupStart: Date;
  pickupEnd: Date;
  pickupCode: string | null;
  status: ListingStatus;
  addressSnapShot: string | null;
  latitude: string | null;
  longitude: string | null;
  storageNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  allergens?: AllergenResponse[];
};

export const createListingSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  quantityAvailable: z.number().int().positive(),
  pickupStart: z.coerce.date(),
  pickupEnd: z.coerce.date(),
  pickupCode: z.string().optional(),
  addressSnapShot: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  storageNote: z.string().optional(),
  allergenIds: z.array(z.uuid()).optional(),
});

export const updateListingSchema = createListingSchema.partial();

export const listingParamsSchema = z.object({
  listingId: z.uuid(),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type ListingParamsInput = z.infer<typeof listingParamsSchema>;
