import { apiClient } from "./apiClient";
import type {
  ReservationEmailResponse,
  ReservationResponse,
} from "@resqplate/shared";

class PickupsAPI {
  async getPickup() {
    return await apiClient.request<{
      reservations: ReservationEmailResponse[];
    }>("GET", "/pickups");
  }

  async findByEmail(email: string) {
    return await apiClient.request<{
      reservations: ReservationEmailResponse[];
    }>("GET", `/pickups/search?email=${encodeURIComponent(email)}`);
  }

  async confirm(reservationId: string, pickupCode: string) {
    return await apiClient.request<{ reservation: ReservationResponse }>(
      "POST",
      `/pickups/${reservationId}/confirm`,
      { pickupCode },
    );
  }

  async markNoShow(reservationId: string) {
    return await apiClient.request<{ reservation: ReservationResponse }>(
      "PATCH",
      `/pickups/${reservationId}/noShow`,
    );
  }
}

export const pickupApi = new PickupsAPI();
