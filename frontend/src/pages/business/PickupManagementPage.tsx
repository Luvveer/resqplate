import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type {
  FoodListingResponse,
  ReservationResponse,
} from "@resqplate/shared";
import { pickupApi } from "../../api/pickups";
import "./Business.css";
import { restaurantListingApi } from "../../api/restaurantListing";

export function PickupManagementPage() {
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [listings, setListings] = useState<FoodListingResponse[]>([]);

  useEffect(() => {
    async function loadReservations() {
      setError(null);
      setIsLoading(true);

      try {
        const reservationsResult = await pickupApi.getPickup();
        setReservations(reservationsResult.reservations);

        const listingResult = await restaurantListingApi.getMyListings();
        setListings(listingResult.listings);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load reservations",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadReservations();
  }, []);

  function getListingTitle(listingId: string) {
    const matchingListing = listings.find(
      (listing) => listing.id === listingId,
    );
    if (!matchingListing) {
      return "Unknown listing";
    }

    return matchingListing.title;
  }

  return (
    <div className="business-page">
      <header className="business-topbar">
        <div className="business-brand">
          <h1>Reservations</h1>
          <p>Confirm pickups and manage no-shows.</p>
        </div>
        <div className="business-actions">
          <Link className="business-link-button secondary" to="/business">
            Dashboard
          </Link>
        </div>
      </header>
      <main className="business-main">
        {error && <p className="business-error">{error}</p>}
        {isLoading ? (
          <p className="business-message"> Loading reservations</p>
        ) : (
          <table className="business-table">
            <thead>
              <tr>
                <th>Reserved At</th>
                <th>Pick up Item</th>
                <th>Pickup Code</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td>{new Date(reservation.reservedAt).toLocaleString()}</td>
                  <td>{getListingTitle(reservation.listingId)}</td>
                  <td>{reservation.pickupCodeDisplay}</td>
                  <td>{reservation.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
