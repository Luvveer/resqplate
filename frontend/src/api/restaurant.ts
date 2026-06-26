import { apiClient } from "./apiClient";
import type {
  RestaurantProfileResponse,
  CreateRestaurantInput,
} from "@resqplate/shared";

class CompanyAPI {
  async getMyRestaurant() {
    return await apiClient.request<{ restaurant: RestaurantProfileResponse }>(
      "GET",
      "/restaurants/me",
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
