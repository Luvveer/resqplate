import { apiClient } from "./apiClient";
import type {
  AdminRestaurantProfileResponse,
  AdminVerificationActionInput,
  verificationStatus,
} from "@resqplate/shared";

class AdminAPI {
  async getRestaurants(status?: verificationStatus) {
    const query = status ? `?status=${status}` : "";

    return await apiClient.request<{
      restaurants: AdminRestaurantProfileResponse[];
    }>("GET", `/admin/restaurants${query}`);
  }

  async getRestaurant(restaurantId: string) {
    return await apiClient.request<{
      restaurant: AdminRestaurantProfileResponse;
    }>("GET", `/admin/restaurants/${restaurantId}`);
  }

  async approveRestaurant(
    restaurantId: string,
    input: AdminVerificationActionInput = {},
  ) {
    return await apiClient.request<{
      restaurant: AdminRestaurantProfileResponse;
    }>("PATCH", `/admin/restaurants/${restaurantId}/approve`, input);
  }

  async rejectRestaurant(
    restaurantId: string,
    input: AdminVerificationActionInput = {},
  ) {
    return await apiClient.request<{
      restaurant: AdminRestaurantProfileResponse;
    }>("PATCH", `/admin/restaurants/${restaurantId}/reject`, input);
  }

  async requestRestaurantInfo(
    restaurantId: string,
    input: AdminVerificationActionInput = {},
  ) {
    return await apiClient.request<{
      restaurant: AdminRestaurantProfileResponse;
    }>("PATCH", `/admin/restaurants/${restaurantId}/request-info`, input);
  }

  async suspendRestaurant(
    restaurantId: string,
    input: AdminVerificationActionInput = {},
  ) {
    return await apiClient.request<{
      restaurant: AdminRestaurantProfileResponse;
    }>("PATCH", `/admin/restaurants/${restaurantId}/suspend`, input);
  }
}

export const adminApi = new AdminAPI();
