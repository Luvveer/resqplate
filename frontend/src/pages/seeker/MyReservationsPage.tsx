import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ReservationWithListingResponse } from "@resqplate/shared";
import { reservationsApi } from "../../api/reservations";
import "./Seeker.css";

// Show the reserved time slot for the seeker
function formatSlotRange(start: Date | string, end: Date | string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  };
  const dateLabel = startDate.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
  return `${dateLabel}, ${startDate.toLocaleTimeString([], timeOptions)} - ${endDate.toLocaleTimeString([], timeOptions)}`;
}
export function MyReservationsPage() {
  const [reservations, setReservations] = useState<
    ReservationWithListingResponse[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Also look at the pre-resetvation state for the cancel so that only the clicked row shows the canceling state
  const [cancellingId, setCancelingId] = useState<string | null>(null);

  async function loadReservations() {
    setError(null);
    setIsLoading(true);
    try {
      const result = await reservationsApi.getMine();
      setReservations(result.reservations);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Sorry!! failed to load your reservations",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReservations();
  }, []);

  async function handleCancel(reservationId: string) {
    setError(null);
    setCancelingId(reservationId);
    try {
      await reservationsApi.cancel(reservationId);
      // Refresh the reservations after canceling so that we can see the status change
      await loadReservations();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Sorry!! failed to cancel the reservation",
      );
    } finally {
      setCancelingId(null);
    }
  }

  return (
    <div className="seeker-page">
      <header className="seeker-topbar">
        <div className="seeker-brand">
          <h1>My Reservations</h1>
          <p>Your pickup codes and reservation status.</p>
        </div>
        <div className="seeker-actions">
          <Link className="seeker-link-button secondary" to="/seeker">
            Browse Food
          </Link>
        </div>
      </header>

      <main className="seeker-main">
        {error && <p className="seeker-error">{error}</p>}

        {isLoading ? (
          <p className="seeker-message">Loading reservations...</p>
        ) : reservations.length === 0 ? (
          <section className="seeker-card">
            <h2>No reservations yet</h2>
            <p className="seeker-muted">
              Reserve a listing from the browse page to see it here.
            </p>
            <Link className="seeker-link-button" to="/seeker">
              Browse Food
            </Link>
          </section>
        ) : (
          <div className="seeker-grid">
            {reservations.map((reservation) => (
              <article key={reservation.id} className="seeker-card">
                <h2>{reservation.listing?.title ?? "Listing unavailable"}</h2>

                <span
                  className={`seeker-status ${reservation.status.toLowerCase()}`}
                >
                  {reservation.status}
                </span>

                {/* Pickup code only matters while the reservation is live. */}
                {reservation.status === "RESERVED" && (
                  <p className="seeker-code">
                    Pickup code:{" "}
                    <strong>{reservation.pickupCodeDisplay ?? "N/A"}</strong>
                  </p>
                )}

                <dl className="seeker-meta">
                  {/* Snapshotted onto the listing when the business created
                      it, so it's the address as it stood at reservation time
                      even if the restaurant later moves or edits its profile. */}
                  {reservation.listing?.addressSnapShot && (
                    <div>
                      <dt>Pickup address</dt>
                      <dd>{reservation.listing.addressSnapShot}</dd>
                    </div>
                  )}
                  {/* The slot the seeker committed to. NOT NULL in the DB, so
                      no null guard needed — it's always present. */}
                  <div>
                    <dt>Pickup slot</dt>
                    <dd>
                      {formatSlotRange(
                        reservation.pickupSlotStart,
                        reservation.pickupSlotEnd,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Reserved</dt>
                    <dd>{new Date(reservation.reservedAt).toLocaleString()}</dd>
                  </div>
                </dl>

                {/* Only a RESERVED reservation can be cancelled. */}
                {reservation.status === "RESERVED" && (
                  <button
                    className="seeker-button danger"
                    onClick={() => handleCancel(reservation.id)}
                    disabled={cancellingId === reservation.id}
                  >
                    {cancellingId === reservation.id
                      ? "Cancelling..."
                      : "Cancel"}
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
