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
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pickupCodeInput, setpickupCodeInput] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<ReservationResponse[]>([]);
  const [hasSearched, setHadSearched] = useState(false);
  const displayedReservations = hasSearched ? searchResult : reservations;

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

  async function handleSearch() {
    const result = await pickupApi.findByEmail(searchEmail);
    setSearchResult(result.reservations);
    setHadSearched(true);
  }

  async function viewAll() {
    setSearchEmail("");
    setHadSearched(false);
  }

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
  async function handleNoShow(reservationId: string) {
    setError(null);
    setUpdatingId(reservationId);
    try {
      await pickupApi.markNoShow(reservationId);
      await loadReservations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark no show");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleConfirm(reservationId: string) {
    setError(null);
    setUpdatingId(reservationId);
    try {
      await pickupApi.confirm(reservationId, pickupCodeInput);
      setpickupCodeInput("");
      await loadReservations();
      if (hasSearched) {
        await handleSearch();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm");
    } finally {
      setUpdatingId(null);
    }
  }
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
        <input
          type="text"
          placeholder="Search by email"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />
        <button onClick={handleSearch}>Search</button>
        <button onClick={viewAll}>View All</button>
        {isLoading ? (
          <p className="business-message"> Loading reservations</p>
        ) : (
          <table className="business-table">
            <thead>
              <tr>
                <th>Pick up Item</th>
                <th>Status</th>
                <th>Actions</th>
                <th>Pickup Slot</th>
              </tr>
            </thead>
            <tbody>
              {displayedReservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td>{getListingTitle(reservation.listingId)}</td>
                  <td>{reservation.status}</td>
                  <td>
                    {reservation.status === "RESERVED" && (
                      <>
                        <input
                          type="text"
                          placeholder="Enter code"
                          value={pickupCodeInput}
                          onChange={(e) => setpickupCodeInput(e.target.value)}
                        />
                        <button
                          className="business-button"
                          disabled={updatingId === reservation.id}
                          onClick={() => handleConfirm(reservation.id)}
                        >
                          {updatingId === reservation.id
                            ? "Updating..."
                            : "Picked Up"}
                        </button>
                        <button
                          className="business-button"
                          disabled={updatingId === reservation.id}
                          onClick={() => handleNoShow(reservation.id)}
                        >
                          {updatingId === reservation.id
                            ? "Updating..."
                            : "No-show"}
                        </button>
                      </>
                    )}
                  </td>
                  <td>
                    {new Date(reservation.pickupSlotStart).toLocaleTimeString(
                      [],
                      { hour: "2-digit", minute: "2-digit" },
                    )}
                    {" - "}
                    {new Date(reservation.pickupSlotEnd).toLocaleTimeString(
                      [],
                      { hour: "2-digit", minute: "2-digit" },
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
