export interface RestaurantProfile {
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
  verificationStatus:
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "SUSPENDED"
    | "INFO_REQUESTED";
  adminNotes: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewRestaurantProfile {
  profileId: string;
  businessName: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone?: string | null | undefined;
  description?: string | null | undefined;
  latitude?: string | null | undefined;
  longitude?: string | null | undefined;
  verificationStatus?:
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "SUSPENDED"
    | "INFO_REQUESTED";
}

/* Feature 2 */
export type ListingStatus = "AVAILABLE" | "RESERVED" | "EXPIRED";

export interface FoodListing {
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
}

export interface NewFoodListing {
  restaurantId: string;
  title: string;
  description?: string | null | undefined;
  category?: string | null | undefined;
  quantityAvailable: number;
  pickupStart: Date;
  pickupEnd: Date;
  pickupCode?: string | null | undefined;
  status?: ListingStatus;
  addressSnapShot?: string | null | undefined;
  latitude?: string | null | undefined;
  longitude?: string | null | undefined;
  storageNote?: string | null | undefined;
}

export interface UpdateFoodListing {
  title?: string;
  description?: string | null;
  category?: string | null;
  quantityAvailable?: number;
  pickupStart?: Date;
  pickupEnd?: Date;
  pickupCode?: string | null;
  addressSnapShot?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  storageNote?: string | null;
}

export interface Allergen {
  id: string;
  name: string;
}

export interface ListingWithAllergens extends FoodListing {
  allergens: Allergen[];
}
