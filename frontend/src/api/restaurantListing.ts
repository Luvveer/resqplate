import { apiClient } from "./apiClient";
import type {
  CreateListingInput,
  FoodListingResponse,
  UpdateListingInput,
} from "@resqplate/shared";

class RestaurantListingAPI {
  async getMyListings() {
    return await apiClient.request<{
      listings: FoodListingResponse[];
    }>("GET", "/restaurants/listings");
  }

  async getMyListing(listingId: string) {
    return await apiClient.request<{
      listing: FoodListingResponse;
    }>("GET", `/restaurants/listings/${listingId}`);
  }

  async createListing(input: CreateListingInput) {
    return await apiClient.request<{
      listing: FoodListingResponse;
    }>("POST", "/restaurants/listings", input);
  }

  async updateListing(listingId: string, input: UpdateListingInput) {
    return await apiClient.request<{
      listing: FoodListingResponse;
    }>("PATCH", `/restaurants/listings/${listingId}`, input);
  }

  async uploadListingImage(listingId: string, imageFile: File) {
    const formData = new FormData();
    formData.append("image", imageFile);

    return apiClient.requestFormData<{
      listing: FoodListingResponse;
    }>("PUT", `/restaurants/listings/${listingId}/image`, formData);
  }

  async expireListing(listingId: string) {
    return await apiClient.request<{
      listing: FoodListingResponse;
    }>("PATCH", `/restaurants/listings/${listingId}/expire`);
  }
}

export const restaurantListingApi = new RestaurantListingAPI();
