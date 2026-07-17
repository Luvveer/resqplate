import { apiClient } from "./apiClient";
import type {
  AllergenResponse,
  PublicListingResponse,
  BrowseListingsQuery,
} from "@resqplate/shared";

class ListingsAPI {
  //Lets get the public listing feed
  async getAllergens() {
    return apiClient.request<{ allergens: AllergenResponse[] }>(
      "GET",
      "/listings/allergens",
    );
  }

  async browse(filters: Partial<BrowseListingsQuery> = {}) {
    const params = new URLSearchParams();
    if (filters.city) params.set("city", filters.city);
    if (filters.category) params.set("category", filters.category);
    if (filters.search) params.set("search", filters.search);
    if (filters.excludeAllergenIds && filters.excludeAllergenIds.length > 0) {
      params.set("excludeAllergenIds", filters.excludeAllergenIds.join(","));
    } //since we expect to get a csv

    const queryString = params.toString();
    const path = queryString ? `/listings?${queryString}` : "/listings";

    return apiClient.request<{ listings: PublicListingResponse[] }>(
      "GET",
      path,
    );
  }

  // Get the details of a specific listing for the seeker to view
  async getById(listingId: string) {
    return apiClient.request<{ listing: PublicListingResponse }>(
      "GET",
      `/listings/${listingId}`,
    );
  }
}

export const listingsApi = new ListingsAPI();
