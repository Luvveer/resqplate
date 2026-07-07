import type {
  FoodListing,
  Allergen,
} from "../restaurants/restaurants.types.js";

// A view of the restaurant for the seekers
export interface RestaurantSummary {
  id: string;
  businessName: string;
  address: string;
  city: string;
  province: string;
}

// A view of the listing for the seekers on the page
export interface PublicListing extends FoodListing {
  allergens: Allergen[];
  restaurant: RestaurantSummary | null;
}
