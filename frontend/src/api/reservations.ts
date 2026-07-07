import { apiClient } from "./apiClient";
import type {
  ReservationResponce,
  ReservationWithListingResponse,
} from "@resqplate/shared";

class ReservationsAPI {
  // Get the details of a specific reservation for the seeker to view (login needed here)
  async create(listingId: string) {
    return apiClient.request<{ reservation: ReservationResponce }>(
      "POST",
      `/reservations/${listingId}`,
    );
  }

  //the seekers own reservations, along with the associated listing details (login needed hereas well)
  async getMine() {
    return apiClient.request<{
      reservations: ReservationWithListingResponse[];
    }>("GET", "/reservations/mine");
  }

  // Cancel the reservation for the seeker (login needed here as well)
  async cancel(reservationId: string) {
    return apiClient.request<{ reservation: ReservationResponce }>(
      "PATCH",
      `/reservations/${reservationId}/cancel`,
    );
  }
}

export const reservationsApi = new ReservationsAPI();
