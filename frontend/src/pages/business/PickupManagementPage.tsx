import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ReservationResponse } from "@resqplate/shared";
import { pickupApi } from "../../api/pickups";
import "./Business.css";

export function PickupManagementPage() {
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadReservations() {
      setError(null);
      setIsLoading(true);

      try {
        const result = await pickupApi.getPickup();
        setReservations(result.reservations);
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
          <p>{reservations.length} reservations found</p>
        )}
      </main>
    </div>
  );
}
