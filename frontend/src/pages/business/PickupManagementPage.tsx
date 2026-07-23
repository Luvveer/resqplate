import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type {
  FoodListingResponse,
  ReservationEmailResponse,
} from "@resqplate/shared";
import { pickupApi } from "../../api/pickups";
import "./Business.css";
import { restaurantListingApi } from "../../api/restaurantListing";

export function PickupManagementPage() {
  const [reservations, setReservations] = useState<ReservationEmailResponse[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [listings, setListings] = useState<FoodListingResponse[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pickupCodeInput, setpickupCodeInput] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<ReservationEmailResponse[]>(
    [],
  );
  const [hasSearched, setHadSearched] = useState(false);
  const [confirmId, setconfirmId] = useState<string | null>(null);
  const [confirmNoShow, setconfirmNoShow] = useState<string | null>(null);

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
      setconfirmNoShow(null);
      setconfirmId(null);
      if (hasSearched) {
        await handleSearch();
      }
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
      setconfirmId(null);
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
  function getEmail(reservationId: string) {
    const reservationEmail = reservations.find(
      (reservation) => reservation.id === reservationId,
    );
    if (!reservationEmail) {
      return "Unknow Email";
    }
    return reservationEmail.seekerEmail;
  }

  const sortedReservations = [...displayedReservations].sort((a, b) => {
    if (a.status === "RESERVED" && b.status !== "RESERVED") {
      return -1;
    }
    if (a.status !== "RESERVED" && b.status === "RESERVED") {
      return 1;
    }
    return 0;
  });
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
          className="business-link-button secondary"
          placeholder="Search by email"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />
        <button onClick={handleSearch} className="business-link-button">
          Search
        </button>
        <button onClick={viewAll} className="business-link-button secondary">
          View All
        </button>
        {isLoading ? (
          <p className="business-message"> Loading reservations</p>
        ) : (
          <table className="business-table">
            <thead>
              <tr>
                <th>Pick up Item</th>
                <th>Status</th>
                <th>Email</th>
                <th>Pickup Start &nbsp;&nbsp;&nbsp; Pickup End</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedReservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td>{getListingTitle(reservation.listingId)}</td>
                  <td>{reservation.status}</td>
                  <td>{getEmail(reservation.id)}</td>
                  <td>
                    {new Date(reservation.pickupSlotStart).toLocaleTimeString(
                      [],
                      { hour: "2-digit", minute: "2-digit" },
                    )}
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    {new Date(reservation.pickupSlotEnd).toLocaleTimeString(
                      [],
                      { hour: "2-digit", minute: "2-digit" },
                    )}
                  </td>
                  <td>
                    {reservation.status === "RESERVED" && (
                      <>
                        {confirmId === reservation.id ? (
                          <>
                            <input
                              type="text"
                              className="business-link-button secondary"
                              placeholder="Enter code"
                              value={pickupCodeInput}
                              onChange={(e) =>
                                setpickupCodeInput(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleConfirm(reservation.id);
                                }
                              }}
                            />
                            <button
                              className="business-button"
                              disabled={updatingId === reservation.id}
                              onClick={() => handleConfirm(reservation.id)}
                            >
                              {updatingId === reservation.id
                                ? "Updating..."
                                : "Confirm"}
                            </button>
                            <button
                              className="business-link-button secondary"
                              onClick={() => setconfirmId(null)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            className="business-button"
                            onClick={() => setconfirmId(reservation.id)}
                          >
                            Pick up
                          </button>
                        )}

                        {confirmId !== reservation.id &&
                          (confirmNoShow === reservation.id ? (
                            <>
                              <button
                                className="business-link-button secondary"
                                disabled={updatingId === reservation.id}
                                onClick={() => handleNoShow(reservation.id)}
                              >
                                {updatingId === reservation.id
                                  ? "Updating..."
                                  : "Confirm No-show"}
                              </button>
                              <button
                                className="business-button"
                                onClick={() => setconfirmNoShow(null)}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              className="business-button"
                              onClick={() => setconfirmNoShow(reservation.id)}
                            >
                              No-Show
                            </button>
                          ))}
                      </>
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
