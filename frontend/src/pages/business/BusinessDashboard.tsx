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

          <div className="business-brand">
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
                <p>
                  {restaurant?.verificationStatus === "INFO_REQUESTED"
                    ? "Admin has requested additional information."
                    : restaurant?.verificationStatus === "REJECTED"
                      ? "Your profile is Rejected."
                      : restaurant?.verificationStatus === "SUSPENDED"
                        ? "Your profile has been suspended."
                        : "Your profile is waiting for admin review."}
                </p>
              </div>

              <span className="business-status pending">
                {restaurant?.verificationStatus ?? "PENDING"}
              </span>
            </div>

            {restaurant?.verificationStatus === "INFO_REQUESTED" ? (
              <div className="business-info-requested">
                <h3>More information required</h3>
                <p>
                  Admin needs additional information before approving your
                  restaurant.
                </p>
                {restaurant.adminNotes ? (
                  <div className="business-admin-notes">
                    <strong>Message from Admin</strong>
                    <p>{restaurant.adminNotes}</p>
                  </div>
                ) : (
                  <p>No additional instruction were provided.</p>
                )}
              </div>
            ) : restaurant?.verificationStatus === "SUSPENDED" ? (
              <p className="business-message">
                Your restaurant has been suspended. You cannot create or manage
                food listing at this time.
              </p>
            ) : restaurant?.verificationStatus === "REJECTED" ? (
              <p className="business-message">
                Your restaurant has been rejected. You cannot create or manage
                food listing at this time.
              </p>
            ) : (
              <p className="business-message">
                Once your profile is approved, you will be able to create and
                manage food listings.
              </p>
            )}
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

        <div className="business-brand">
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

          <div className="business-nav-grid">
            <Link className="business-nav-card" to="/business/listings">
              <span className="business-nav-icon">📋</span>
              <span className="business-nav-title">Manage Listings →</span>
              <span className="business-nav-desc">
                Create, edit, and expire your surplus food listings.
              </span>
            </Link>

            <Link className="business-nav-card" to="/business/pickups">
              <span className="business-nav-icon">🍱</span>
              <span className="business-nav-title">Manage Reservations →</span>
              <span className="business-nav-desc">
                Confirm pickups and track no-shows.
              </span>
            </Link>

            <Link className="business-link-button" to="/business/profile">
              Account
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
