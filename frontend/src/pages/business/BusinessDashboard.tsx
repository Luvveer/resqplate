import { useAuth } from "../../auth/useAuth";
import { useState, useEffect } from "react";
import { companyApi } from "../../api/restaurant";
import type { RestaurantProfileResponse } from "@resqplate/shared";
import { Link } from "react-router-dom";
import "./Business.css";

export function BusinessDashboard() {
  const { profile, logout } = useAuth();
  const [restaurant, setRestaurant] =
    useState<RestaurantProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    companyApi
      .getMyRestaurant()
      .then((result) => setRestaurant(result.restaurant))
      .catch(() => setRestaurant(null))
      .finally(() => setIsLoading(false));
  }, []);
  if (isLoading) {
    return (
      <main className="business-page">
        <div className="business-main">
          <p className="business-message">Loading business dashboard...</p>;
        </div>
      </main>
    );
  }

  if (restaurant?.verificationStatus !== "APPROVED") {
    return (
      <div className="business-page">
        <header className="business-topbar">
          <div className="business-brand">
            <h1>ResQPlate Business</h1>
            <p>Restaurant Dashboard</p>
          </div>

          <div className="business-user">
            <span>Welcome, {profile?.name}</span>
            <button
              className="business-button secondary"
              onClick={() => logout()}
            >
              Logout
            </button>
          </div>
        </header>

        <main className="business-main">
          <section className="business-card">
            <div className="business-header">
              <div>
                <h2>Business Dashboard</h2>
                <p>Your restaurant profile is waiting for admin review.</p>
              </div>

              <span className="business-status pending">
                {restaurant?.verificationStatus ?? "PENDING"}
              </span>
            </div>

            <p className="business-message">
              Once your profile is approved, you will be able to create and
              manage food listings.
            </p>
          </section>
        </main>
      </div>
    );
  }
  return (
    <div className="business-page">
      <header className="business-topbar">
        <div className="business-brand">
          <h1>ResQPlate Business</h1>
          <p>Restaurant dashboard</p>
        </div>

        <div className="business-user">
          <span> Welcome, {profile?.name}</span>
          <button
            className="business-button secondary"
            onClick={() => logout()}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="business-main">
        <section className="business-card">
          <div className="business-header">
            <div>
              <h2>{restaurant.businessName}</h2>
              <p>Manage your restaurant profile and food listings.</p>
            </div>

            <span className="business-status approved">Approved</span>
          </div>

          <div className="business-actions">
            <Link className="business-link-button" to="/business/listings">
              Manage Listings
            </Link>
            <Link className="business-link-button" to="/business/pickups">
              Manage Reservations
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
