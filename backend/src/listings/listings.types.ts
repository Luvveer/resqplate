import type {
  FoodListing,
  Allergen,
} from "../restaurants/restaurants.types.js";

export interface RestaurantSummary {
  id: string;
  businessName: string;
  address: string;
  city: string;
  province: string;
  // postalCode: string;
  // phone: string | null;
  // description: string | null;
  // verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  // createdAt: Date;
  // updatedAt: Date;
}

export interface PublicListing extends FoodListing {
  allergens: Allergen[];
  restaurant: RestaurantSummary | null;
}
