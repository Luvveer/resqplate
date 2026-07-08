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

export const verificationStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
  "INFO_REQUESTED",
]);

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type verificationStatus = z.infer<typeof verificationStatusSchema>;

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
  verificationStatus: verificationStatus;
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

export type AdminRestaurantProfileResponse = {
  id: string;
  profileId: string;
  businessName: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string | null;
  description: string | null;
  verificationStatus: verificationStatus;
  adminNotes: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export const AdminRestaurantParamsSchema = z.object({
  restaurantId: z.uuid(),
});

export const AdminRestaurantStatusQuerySchema = z.object({
  status: verificationStatusSchema.optional(),
});

export const AdminVerificationActionSchema = z.object({
  adminNotes: z.string().optional(),
});

export type AdminRestaurantParamsInput = z.infer<
  typeof AdminRestaurantParamsSchema
>;
export type AdminRestaurantStatusQueryInput = z.infer<
  typeof AdminRestaurantStatusQuerySchema
>;
export type AdminVerificationActionInput = z.infer<
  typeof AdminVerificationActionSchema
>;
export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;

/* Listing */
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

// Feature 3 -Food listing (the browser and search for food items) + reservations)

//Function to match on the restaurant's city, listing category, and free text search
export const browseListingsQuerySchema = z.object({
  city: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
  // Constraint for the allergens to be excluded from the search results.
  excludeAllergenIds: z
    .string()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean)
        : [],
    )
    .pipe(z.array(z.uuid())),
});

export type BrowseListingsQuery = z.infer<typeof browseListingsQuerySchema>; //single unit for listing

export const createReservationSchema = z.object({
  listingId: z.uuid(),
  // pickupCode: z.string().min(1),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
// export type ReservationParamsInput = z.infer<typeof createReservationSchema>; // reuse listingParamsSchema for reservation params

export type ReservationStatus =
  | "RESERVED"
  | "PICKED_UP"
  | "CANCELLED"
  | "EXPIRED"
  | "NO_SHOW";

// the validation for the reservation and the reservationId routes
export const reservationParamsSchema = z.object({ reservationId: z.uuid() });
export type ReservationParamsInput = z.infer<typeof reservationParamsSchema>;

// Returning the shape of the reservation response object row
export type ReservationResponse = {
  id: string;
  profileId: string;
  listingId: string;
  pickupCodeDisplay: string | null;
  status: ReservationStatus;
  reservedAt: Date;
  pickedUpAt: Date | null;
  cancelledAt: Date | null;
  // expiredAt: Date | null;
  noShowAt: Date | null;
  // createdAt: Date;
  // updatedAt: Date;
};

// Reserved by the seeker and what was reserved and the pickup code
export type ReservationWithListingResponse = ReservationResponse & {
  listing: FoodListingResponse | null;
};

// The listing as the seaker will see it
export type PublicListingResponse = FoodListingResponse & {
  restaurant: {
    id: string;
    businessName: string;
    address: string;
    city: string;
    province: string;
    // postalCode: string;
  } | null;
};
