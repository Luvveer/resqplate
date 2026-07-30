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

// UI Mapping the reservations status to their status-pill variant
function statusPill(status: string): string {
  switch (status) {
    case "RESERVED":
      return "rq-pill-herb";
    case "PICKED_UP":
      return "rq-pill-stone";
    case "CANCELLED":
    case "EXPIRED":
    case "NO_SHOW":
      return "rq-pill-ember";
    default:
      return "rq-pill-stone";
  }
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
    <div className="sk-page">
      <header className="sk-topbar">
        <div className="sk-brand">
          <span className="sk-brand-mark" aria-hidden="true" />
          <span className="sk-brand-text">
            <b>ResQPlate</b>
          </span>
        </div>
        <div className="sk-topbar-spacer" />
        <nav className="sk-nav">
          <Link className="sk-nav-link" to="/seeker">
            Browse
          </Link>
          <Link className="sk-nav-link is-active" to="/seeker/reservations">
            My reservations
          </Link>
          <Link className="sk-nav-link" to="/seeker/profile">
            Profile
          </Link>
        </nav>
      </header>

      <main className="sk-main">
        <div className="sk-head">
          <div>
            <h1 className="rq-display sk-title">My reservations</h1>
            <p className="sk-sub">
              Your claimed rescues. Show the pickup code at the counter.
            </p>
          </div>
        </div>

        {error && <p className="rq-error">{error}</p>}

        {isLoading ? (
          <p className="sk-message">Loading reservations...</p>
        ) : reservations.length === 0 ? (
          <section className="rq-card sk-empty">
            <h2 className="rq-display">No reservations yet</h2>
            <p className="rq-muted">
              Reserve a listing from the browse page to see it here.
            </p>
            <Link className="rq-btn rq-btn-primary" to="/seeker">
              Browse food
            </Link>
          </section>
        ) : (
          <div className="sk-ticket-grid">
            {reservations.map((reservation) => {
              const isReserved = reservation.status === "RESERVED";
              return (
                <article key={reservation.id} className="sk-ticket">
                  <div className="sk-ticket-head">
                    <div>
                      <h2 className="sk-ticket-title">
                        {reservation.listing?.title ?? "Listing unavailable"}
                      </h2>
                    </div>
                    <span
                      className={`rq-pill ${statusPill(reservation.status)}`}
                    >
                      {reservation.status.replace("_", " ")}
                    </span>
                  </div>

                  <dl className="sk-ticket-meta">
                    {reservation.listing?.addressSnapShot && (
                      <div>
                        <dt>Pickup address</dt>
                        <dd>{reservation.listing.addressSnapShot}</dd>
                      </div>
                    )}
                    <div>
                      <dt>Pickup slot</dt>
                      <dd>
                        {formatSlotRange(
                          reservation.pickupSlotStart,
                          reservation.pickupSlotEnd,
                        )}
                      </dd>
                    </div>
                  </dl>
                  {isReserved && (
                    <div className="sk-stub">
                      <span className="sk-stub-label rq-mono">
                        Present at counter
                      </span>
                      <div className="sk-stub-code rq-mono">
                        {reservation.pickupCodeDisplay ?? "N/A"}
                      </div>
                      <span className="sk-stub-foot">
                        Show this code at the counter
                      </span>
                    </div>
                  )}

                  {isReserved && (
                    <button
                      className="sk-ticket-cancel"
                      onClick={() => handleCancel(reservation.id)}
                      disabled={cancellingId === reservation.id}
                    >
                      {cancellingId === reservation.id
                        ? "Cancelling..."
                        : "Cancel reservation"}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
