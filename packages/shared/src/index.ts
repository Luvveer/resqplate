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

// Feature 3 -Food listing (the browser and search for food items) + reservations)

// Function to export everything that a user would seek in the app and filter by, optional fields
export const listingFilterSchema = z.object({
  q: z.string.trim().min(1).optional(),
  city: z.string.trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  //incase there are any algeries that the user wants to avoid
  excludeAllergens: z.array(z.string().trim().min(1)).optional(),
});
