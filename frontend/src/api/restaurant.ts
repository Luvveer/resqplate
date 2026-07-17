import { apiClient } from "./apiClient";
import type {
  RestaurantProfileResponse,
  CreateRestaurantInput,
  AddressAutocompleteInput,
  AddressSuggestion,
} from "@resqplate/shared";

class CompanyAPI {
  async getMyRestaurant() {
    return await apiClient.request<{ restaurant: RestaurantProfileResponse }>(
      "GET",
      "/restaurants/profileres",
    );
  }

  async getAddressSuggestions(input: AddressAutocompleteInput) {
    return apiClient.request<{ suggestions: AddressSuggestion[] }>(
      "POST",
      "/restaurants/address-suggestions",
      input,
    );
  }

  async createRestaurant(input: CreateRestaurantInput) {
    return await apiClient.request<{ restaurant: RestaurantProfileResponse }>(
      "POST",
      "/restaurants/signup",
      input,
    );
  }
}

export const companyApi = new CompanyAPI();
