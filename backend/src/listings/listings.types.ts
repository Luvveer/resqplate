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
}

export interface PublicListing extends FoodListing {
  allergens: Allergen[];
  restaurant: RestaurantSummary | null;
}
