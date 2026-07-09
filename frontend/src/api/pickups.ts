import { apiClient } from "./apiClient";
import type { ReservationResponse } from "@resqplate/shared";

class PickupsAPI {
  async getPickup() {
    return await apiClient.request<{ reservations: ReservationResponse[] }>(
      "GET",
      "/pickups",
    );
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
