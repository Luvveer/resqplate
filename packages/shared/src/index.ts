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
  latitude: string | null;
  longitude: string | null;
  verificationStatus: verificationStatus;
  adminNotes: string | null;
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
  status: ListingStatus;
  addressSnapShot: string | null;
  latitude: string | null;
  longitude: string | null;
  storageNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  allergens?: AllergenResponse[];
};

const listingFieldSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  quantityAvailable: z.number().int().positive(),
  pickupStart: z.coerce.date(),
  pickupEnd: z.coerce.date(),
  storageNote: z.string().optional(),
  allergenIds: z.array(z.uuid()).optional(),
});

export const createListingSchema = listingFieldSchema
  .refine((input) => input.pickupEnd > input.pickupStart, {
    message: "Pickup end time must be after pickup start time",
    path: ["pickupEnd"],
  })
  .refine(
    (input) =>
      input.pickupEnd.getTime() - input.pickupStart.getTime() <=
      24 * 60 * 60 * 1000,
    {
      message: "Pickup window cannot be longer than 24 hours.",
      path: ["pickupEnd"],
    },
  );

export const updateListingSchema = listingFieldSchema.partial();

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

//The Pickup timeSlot window and workflow
export const PICKUP_SLOT_MINUTES = 60;
const SLOT_MS = PICKUP_SLOT_MINUTES * 60 * 1000;

export type PickupSlot = {
  start: Date;
  end: Date;
};

//make the slot of the pickup time window for the listing
export function generatePickupSlots(
  pickupStart: Date | string,
  pickupEnd: Date | string,
  now: Date = new Date(),
): PickupSlot[] {
  const windowStart = new Date(pickupStart);
  const windowEnd = new Date(pickupEnd);
  const slots: PickupSlot[] = [];

  // Guard against a malformed / inverted window.
  if (
    Number.isNaN(windowStart.getTime()) ||
    Number.isNaN(windowEnd.getTime()) ||
    windowEnd.getTime() <= windowStart.getTime()
  ) {
    return slots;
  }

  let cursor = windowStart.getTime();
  const endMs = windowEnd.getTime();

  while (cursor < endMs) {
    // Clamp the last slot to the window end so partial tails survive.
    const slotEnd = Math.min(cursor + SLOT_MS, endMs);

    // Hide slots that have already finished.
    if (slotEnd > now.getTime()) {
      slots.push({ start: new Date(cursor), end: new Date(slotEnd) });
    }

    cursor = slotEnd;
  }

  return slots;
}
//This is the function to find the matching pickup slot for a given listing and pickup time window is correctly valid and matched
export function findMatchingPickupSlot(
  pickupStart: Date | string,
  pickupEnd: Date | string,
  slotStart: Date | string,
  now: Date = new Date(),
): PickupSlot | undefined {
  const target = new Date(slotStart).getTime();
  if (Number.isNaN(target)) {
    return undefined;
  }
  return generatePickupSlots(pickupStart, pickupEnd, now).find(
    (slot) => slot.start.getTime() === target,
  );
}

export const createReservationSchema = z.object({
  listingId: z.uuid(),
  // pickupCode: z.string().min(1),

  //Now start the seeker's chosen one hour time slot for the pickup window, which is a required field for the reservation
  pickupSlotStart: z.coerce.date(),
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
  pickupSlotStart: Date;
  pickupSlotEnd: Date;
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

export const reservationStatusQuerySchema = z.object({
  status: z
    .enum(["RESERVED", "PICKED_UP", "CANCELLED", "EXPIRED", "NO_SHOW"])
    .optional(),
});

export const confirmPickupSchema = z.object({
  pickupCode: z.string().min(1),
});

export const requestPasswordResetSchema = z.object({
  email: z.email(),
  redirectTo: z.string(),
});

export type requestPasswordResetInput = z.infer<
  typeof requestPasswordResetSchema
>;

export const confirmPasswordResetSchema = z.object({
  newPassword: z.string().min(8),
  token: z.string(),
});

export type confirmPasswordResetInput = z.infer<
  typeof confirmPasswordResetSchema
>;
